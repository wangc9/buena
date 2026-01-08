/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, beforeEach, afterEach, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import BuildingContent from "./BuildingContent";
import { toast } from "sonner";

vi.mock("@cw/schema", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const z = require("zod");

  const BuildingDataSchema = z.object({
    propertyId: z.string(),
    name: z.string().min(1, "Name is required"),
    street: z.string().min(1, "Street is required"),
    house: z.number({ invalid_type_error: "House must be a number" }),
    other: z.string().optional(),
    tempId: z.string().optional(),
  });

  return {
    BuildingDataSchema,
    BuildingArraySchema: z.object({
      buildings: z.array(BuildingDataSchema),
    }),
    BuildingFormSchema: z.object({
      buildings: z.array(BuildingDataSchema),
    }),
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("./ui/dialog", () => ({
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <footer>{children}</footer>
  ),
}));

const ORIGINAL_ENV = process.env;

describe("BuildingContent Component", () => {
  const mockSetStep = vi.fn();
  const mockSetBuildings = vi.fn();
  const mockSetBuildingMap = vi.fn();
  const mockPropertyId = "prop-123";
  const mockPropertyName = "Test Property";

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_API_URL = "http://api.test.com";
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.clearAllMocks();
  });

  const setup = (props: any = {}) => {
    return render(
      <BuildingContent
        setStep={mockSetStep}
        setBuildings={mockSetBuildings}
        propertyId={mockPropertyId}
        propertyName={mockPropertyName}
        setBuildingIdMap={mockSetBuildingMap}
        parsedBuildings={undefined}
        {...props}
      />
    );
  };

  it("Renders the initial form with one empty building by default", () => {
    setup();

    expect(
      screen.getByText(`New Building in ${mockPropertyName}`)
    ).toBeInTheDocument();
    expect(screen.getByText("Building 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
  });

  it("Pre-fills the form when parsedBuildings are provided", () => {
    const mockParsed = {
      buildings: [
        {
          name: "AI Generated Building",
          street: "AI Street",
          house: 10,
          other: "Parsed data",
          tempId: "temp-ai-1",
          propertyId: "",
        },
      ],
    };

    setup({ parsedBuildings: mockParsed });

    expect(
      screen.getByDisplayValue("AI Generated Building")
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("AI Street")).toBeInTheDocument();
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();
  });

  it("Allows adding and removing buildings", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: /Add Building/i }));

    expect(screen.getByText("Building 2")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Building Name/i).length).toBe(2);

    await user.click(
      screen.getByRole("button", { name: /Remove Building 2/i })
    );

    expect(screen.queryByText("Building 2")).toBeNull();
    expect(screen.getAllByLabelText(/Building Name/i).length).toBe(1);
  });

  it("Shows validation errors when submitting empty form", async () => {
    const { container } = setup();

    const form = container.querySelector("#building-form");
    fireEvent.submit(form!);

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(await screen.findByText("Street is required")).toBeInTheDocument();
  });

  it("Converts house number input from string to number correctly", async () => {
    const user = userEvent.setup();
    const { container } = setup();

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ successBuildings: [], failedBuildings: [] }),
    });

    await user.type(screen.getByLabelText(/Building Name/i), "Block A");
    await user.type(screen.getByLabelText(/Street/i), "Test Street");
    await user.type(screen.getByLabelText(/House Number/i), "123");

    const form = container.querySelector("#building-form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const calls = (global.fetch as any).mock.calls;
    const body = JSON.parse(calls[0][1].body);

    expect(body.buildings[0].house).toBe(123);
    expect(typeof body.buildings[0].house).toBe("number");
  });

  it("Handles successful submission and maps Temp IDs to Real IDs", async () => {
    const mockParsed = {
      buildings: [
        {
          name: "Block A",
          street: "Test Street",
          house: 123,
          other: "",
          tempId: "temp-123",
          propertyId: "",
        },
      ],
    };

    const { container } = setup({ parsedBuildings: mockParsed });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        successBuildings: [{ id: "real-db-id-123", name: "Block A" }],
        failedBuildings: [],
      }),
    });

    const form = container.querySelector("#building-form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://api.test.com/buildings",
        expect.objectContaining({ method: "POST" })
      );

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Successfully created buildings: Block A")
      );

      expect(mockSetBuildings).toHaveBeenCalledWith([
        { id: "real-db-id-123", name: "Block A" },
      ]);

      expect(mockSetBuildingMap).toHaveBeenCalledWith({
        "temp-123": "real-db-id-123",
      });

      expect(mockSetStep).toHaveBeenCalledWith("unit");
    });
  });

  it("Handles partial failure response", async () => {
    const user = userEvent.setup();
    const { container } = setup();

    (global.fetch as any).mockResolvedValue({
      json: async () => ({
        successBuildings: [],
        failedBuildings: [{ name: "Block B" }],
      }),
    });

    await user.type(screen.getByLabelText(/Building Name/i), "Block B");
    await user.type(screen.getByLabelText(/Street/i), "Bad St");
    await user.type(screen.getByLabelText(/House Number/i), "99");

    const form = container.querySelector("#building-form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to create buildings: Block B")
      );
      expect(mockSetStep).not.toHaveBeenCalled();
    });
  });

  it("handles network errors gracefully", async () => {
    const user = userEvent.setup();
    const { container } = setup();
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    (global.fetch as any).mockRejectedValue(new Error("Network Error"));

    await user.type(screen.getByLabelText(/Building Name/i), "Block C");
    await user.type(screen.getByLabelText(/Street/i), "C St");
    await user.type(screen.getByLabelText(/House Number/i), "1");

    const form = container.querySelector("#building-form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(mockSetStep).not.toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});
