import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProductForm } from "../../src/components/admin/ProductForm";

describe("ProductForm", () => {
  it("mostra erro de validação quando nome é muito curto", async () => {
    render(<ProductForm onSubmit={vi.fn()} />);

    fireEvent.input(screen.getByLabelText(/nome/i), { target: { value: "ab" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByText(/ao menos 3 caracteres/i)).toBeInTheDocument();
  });

  it("chama onSubmit com dados válidos", async () => {
    const onSubmit = vi.fn();
    render(<ProductForm onSubmit={onSubmit} />);

    fireEvent.input(screen.getByLabelText(/nome/i), { target: { value: "Marguerita" } });
    fireEvent.input(screen.getByLabelText(/descrição/i), {
      target: { value: "Molho de tomate, mussarela e manjericão" },
    });
    fireEvent.input(screen.getByLabelText(/categoria/i), { target: { value: "Tradicional" } });
    fireEvent.input(screen.getByLabelText(/preço base/i), { target: { value: "39.9" } });
    fireEvent.input(screen.getByLabelText(/url da imagem/i), {
      target: { value: "https://example.com/marguerita.jpg" },
    });

    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });
});
