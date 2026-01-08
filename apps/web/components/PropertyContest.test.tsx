/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, beforeEach, afterEach, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import PropertyContent from "./PropertyContent";

const { mockParseFile } = vi.hoisted(() => ({
  mockParseFile: vi.fn(),
}));

vi.mock("@/lib/usePdfParser", () => ({
  usePdfParser: () => ({
    parsePdf: mockParseFile,
    isParsing: false,
  }),
}));

vi.mock("@cw/schema", () => {
  const z = require("zod");
  const PropertySchema = z.object({
    type: z.enum(["WEG", "MV"]),
    name: z.string().min(1, "Name is required"),
    manager: z.string().min(1, "Manager is required"),
    accountant: z.string().min(1, "Accountant is required"),
    url: z.string().optional(),
  });
  return { PropertySchema };
});

vi.mock("next/image", () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));
vi.mock("@/public/WEG.png", () => ({ default: "/mock-weg.png" }));
vi.mock("@/public/MV.png", () => ({ default: "/mock-mv.png" }));

vi.mock("./ui/dialog", () => ({
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <footer>{children}</footer>,
}));

vi.mock("lucide-react", () => ({
  CircleCheck: () => <span data-testid="icon-check">Check</span>,
  CircleX: () => <span data-testid="icon-x">X</span>,
  Loader2: () => <span data-testid="icon-spinner">Loading</span>,
}));

vi.mock("./ui/spinner", () => ({
  Spinner: () => <span data-testid="loading-spinner">Loading...</span>,
}));

const ORIGINAL_ENV = process.env;

describe("PropertyContent Component", () => {
  const mockSetStep = vi.fn();
  const mockSetPropertyId = vi.fn();
  const mockSetPropertyName = vi.fn();
  const mockSetParsedData = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    mockParseFile.mockReset();
    mockParseFile.mockResolvedValue(null);

    process.env.NEXT_PUBLIC_API_URL = "http://api.test.com";
    process.env.NEXT_PUBLIC_S3_URL = "http://s3.test.com";
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.clearAllMocks();
  });

  const setup = () => {
    return render(
      <PropertyContent
        setStep={mockSetStep}
        setPropertyId={mockSetPropertyId}
        setPropertyName={mockSetPropertyName}
        setParsedData={mockSetParsedData}
      />
    );
  };

  it("Renders the initial form", () => {
    setup();
    expect(screen.getByText(`New Property`)).toBeInTheDocument();
    expect(screen.getByLabelText(/Manager/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Accountant/i)).toBeInTheDocument();
  });

  it("Shows validation errors when submitting empty form", async () => {
    const { container } = setup();

    const form = container.querySelector("#property-form");
    fireEvent.submit(form!);

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(await screen.findByText("Manager is required")).toBeInTheDocument();
    expect(
      await screen.findByText("Accountant is required")
    ).toBeInTheDocument();
  });

  it("Calls the hook and updates state when file is uploaded", async () => {
    const user = userEvent.setup();
    setup();

    expect(screen.getByTestId("icon-x")).toBeInTheDocument();

    mockParseFile.mockResolvedValue({
      url: "https://s3.test.com/uploaded.pdf",
      key: "abc-123",
    });

    const file = new File(["dummy content"], "deed.pdf", {
      type: "application/pdf",
    });
    const fileInput = screen.getByLabelText(/Property File/i);

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(mockParseFile).toHaveBeenCalledWith(file);
    });
  });

  it("Submits the form successfully and advances step", async () => {
    const { container } = setup();

    const mockResponse = { id: "prop-1", name: "Sunshine Estates" };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    fireEvent.change(screen.getByLabelText(/Property Name/i), {
      target: { value: "Sunshine Estates" },
    });
    fireEvent.change(screen.getByLabelText(/Manager Name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Accountant Name/i), {
      target: { value: "Jane Smith" },
    });

    const form = container.querySelector("#property-form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://api.test.com/property",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Sunshine Estates"),
        })
      );

      expect(mockSetPropertyId).toHaveBeenCalledWith("prop-1");
      expect(mockSetStep).toHaveBeenCalledWith("building");
    });
  });
});
