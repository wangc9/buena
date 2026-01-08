/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, beforeEach, afterEach, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import UnitContent from "./UnitContent";
import { toast } from "sonner";

vi.mock("@cw/schema", () => {
  const z = require("zod");

  const UnitDataSchema = z.object({
    buildingId: z.string(),
    type: z.enum(["Apartment", "Office", "Garden", "Parking"]),
    number: z.number(),
    floor: z.number(),
    entrance: z.string().min(1, "Entrance is required"),
    size: z.number().min(0),
    ownershipShare: z.string().min(1, "Share is required"),
    year: z.number(),
    rooms: z.number(),
    buildingTempId: z.string().optional(),
  });

  return {
    UnitDataSchema,
    UnitArraySchema: z.object({
      units: z.array(UnitDataSchema),
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
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <footer>{children}</footer>,
}));

vi.mock("./ui/select", () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <select
      data-testid="mock-select"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
}));

const mockInvalidateQueries = vi.fn();
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

const ORIGINAL_ENV = process.env;

describe("UnitContent Component", () => {
  const mockSetStep = vi.fn();
  const mockSetOpen = vi.fn();

  const mockBuildings = [
    { id: "b1", name: "Building A" },
    { id: "b2", name: "Building B" },
  ];

  const mockBuildingIdMap = {
    "temp-1": "b1",
    "temp-2": "b2",
  };

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
      <UnitContent
        setStep={mockSetStep}
        setOpen={mockSetOpen}
        propertyName="Test Property"
        buildings={mockBuildings}
        buildingIdMap={mockBuildingIdMap}
        parsedUnits={null}
        {...props}
      />
    );
  };

  it("Renders the form with one unit default", () => {
    setup();
    expect(screen.getByText("New Units in Test Property")).toBeInTheDocument();
    expect(screen.getByText("Building 1")).toBeInTheDocument();
    expect(screen.getByLabelText(/Unit Number/i)).toBeInTheDocument();
  });

  it("Pre-fills form with AI data and maps building IDs correctly", () => {
    const mockParsedUnits = {
      units: [
        {
          buildingTempId: "temp-2",
          type: "Office",
          number: 101,
          floor: 1,
          entrance: "Main",
          size: 50.5,
          ownershipShare: "10/1000",
          year: 2020,
          rooms: 2,
        },
      ],
    };

    setup({ parsedUnits: mockParsedUnits });

    const selects = screen.getAllByTestId("mock-select");
    expect((selects[0] as HTMLSelectElement).value).toBe("b2");

    expect(screen.getByDisplayValue("Main")).toBeInTheDocument();
    expect(screen.getByDisplayValue("50.5")).toBeInTheDocument();
    expect(screen.getByDisplayValue("101")).toBeInTheDocument();
  });

  it("Handles decimal input for size correctly (comma/dot)", async () => {
    const user = userEvent.setup();
    setup();

    const sizeInput = screen.getByLabelText(/Unit Size/i);

    await user.type(sizeInput, "45,5");
    fireEvent.blur(sizeInput);

    expect(sizeInput).toHaveValue("45.5");
  });

  it("Allows adding and removing units", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: /Add Unit/i }));

    expect(screen.getAllByLabelText(/Unit Number/i)).toHaveLength(2);

    const removeBtns = screen.getAllByRole("button", { name: "" });
    await user.click(removeBtns[0]);

    expect(screen.getAllByLabelText(/Unit Number/i)).toHaveLength(1);
  });

  it("Shows validation errors on empty submit", async () => {
    const { container } = setup();

    const form = container.querySelector("#unit-form");
    fireEvent.submit(form!);

    expect(await screen.findByText("Entrance is required")).toBeInTheDocument();
    expect(await screen.findByText("Share is required")).toBeInTheDocument();
  });

  it("Submits successfully and resets wizard", async () => {
    const user = userEvent.setup();
    const { container } = setup();

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        successUnits: [{ number: 10 }],
        failedUnits: [],
      }),
    });

    await user.type(screen.getByLabelText(/Entrance/i), "Side A");
    await user.type(screen.getByLabelText(/Ownership Share/i), "1/100");
    await user.type(screen.getByLabelText(/Unit Size/i), "50");
    fireEvent.blur(screen.getByLabelText(/Unit Size/i));

    const form = container.querySelector("#unit-form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://api.test.com/units",
        expect.objectContaining({ method: "POST" })
      );

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["properties"],
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Successfully created units")
      );

      expect(mockSetOpen).toHaveBeenCalledWith(false);
      expect(mockSetStep).toHaveBeenCalledWith("property");
    });
  });

  it("Handles failure response", async () => {
    const user = userEvent.setup();
    const { container } = setup();

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        successUnits: [],
        failedUnits: [{ number: 99 }],
      }),
    });

    await user.type(screen.getByLabelText(/Entrance/i), "Side B");
    await user.type(screen.getByLabelText(/Ownership Share/i), "2/100");
    await user.type(screen.getByLabelText(/Unit Size/i), "10");
    fireEvent.blur(screen.getByLabelText(/Unit Size/i));

    const form = container.querySelector("#unit-form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to create units: 99")
      );
      expect(mockSetOpen).not.toHaveBeenCalled();
    });
  });
});
