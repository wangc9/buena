import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import path from "path";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfrontOrigins from "aws-cdk-lib/aws-cloudfront-origins";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "BuenaVpc", {
      maxAzs: 2,
      natGateways: 1,
    });

    const db = new rds.DatabaseInstance(this, "BuenaDB", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17_6,
      }),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      allocatedStorage: 20,
      maxAllocatedStorage: 50,
      publiclyAccessible: false,
      databaseName: "buena",
    });

    const uploadBucket = new s3.Bucket(this, "BuenaUpload", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });

    const lambdaFunction = new lambdaNode.NodejsFunction(
      this,
      "buenaPdfParser",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(__dirname, "../lambda/parsePdf/index.ts"),
        handler: "handler",
        timeout: cdk.Duration.seconds(900),
        memorySize: 1024,
        environment: {
          BUCKET_NAME: uploadBucket.bucketName,
          OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
          REGION: this.region,
        },
        bundling: {
          minify: true,
          sourceMap: true,
          externalModules: ["@aws-sdk/client-s3"],
        },
      }
    );

    uploadBucket.grantReadWrite(lambdaFunction);

    const cluster = new ecs.Cluster(this, "BuenaCluster", { vpc });

    const api = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      "ApiService",
      {
        cluster,
        memoryLimitMiB: 1024,
        cpu: 512,
        desiredCount: 1,
        taskImageOptions: {
          containerPort: 3000,
          image: ecs.ContainerImage.fromAsset(path.join(__dirname, "../../"), {
            file: "apps/server/Dockerfile",
            ignoreMode: cdk.IgnoreMode.DOCKER,
            exclude: ["apps/web", "cdk", "node_modules"],
          }),
          environment: {
            NODE_ENV: "production",
            AWS_REGION: this.region,
            UPLOAD_BUCKET_NAME: uploadBucket.bucketName,
            PARSER_LAMBDA_NAME: lambdaFunction.functionName,
            DATABASE_URL: `postgres://${db.secret?.secretValueFromJson("username").unsafeUnwrap()}:${db.secret?.secretValueFromJson("password").unsafeUnwrap()}@${db.dbInstanceEndpointAddress}:${db.dbInstanceEndpointPort}/buena`,
          },
        },
        publicLoadBalancer: true,
      }
    );
    db.connections.allowFrom(api.service, ec2.Port.tcp(5432));

    api.targetGroup.configureHealthCheck({
      path: "/",
      interval: cdk.Duration.seconds(60),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 5,
      timeout: cdk.Duration.seconds(30),
    });
    lambdaFunction.grantInvoke(api.taskDefinition.taskRole);
    uploadBucket.grantReadWrite(api.taskDefinition.taskRole);

    const corsPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      "BuenaCorsPolicy",
      {
        corsBehavior: {
          accessControlAllowCredentials: false,
          accessControlAllowHeaders: ["*"],
          accessControlAllowMethods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS",
          ],
          accessControlAllowOrigins: ["*"],
          originOverride: true,
        },
      }
    );

    const distribution = new cloudfront.Distribution(
      this,
      "BuenaApiDistribution",
      {
        defaultBehavior: {
          origin: new cloudfrontOrigins.LoadBalancerV2Origin(api.loadBalancer, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          }),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          responseHeadersPolicy: corsPolicy,
        },
      }
    );

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.loadBalancer.loadBalancerDnsName,
    });
    new cdk.CfnOutput(this, "S3BucketName", {
      value: uploadBucket.bucketName,
    });
    new cdk.CfnOutput(this, "BucketURL", {
      value: `https://${uploadBucket.bucketName}.s3.${this.region}.amazonaws.com`,
    });
    new cdk.CfnOutput(this, "CloudFrontURL", {
      value: `https://${distribution.distributionDomainName}`,
    });
  }
}
