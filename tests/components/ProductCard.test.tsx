import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "../../src/components/store/ProductCard";
import type { Pizza } from "../../src/types/product";

const pizza: Pizza = {
  id: "1",
  name: "Calabresa",
  description: "Molho, mussarela, calabresa fatiada, cebola e orégano",
  imageUrl: "https://placehold.co/400x280",
  basePrice: 39.9,
  category: "salgada",
  availableSizes: ["P", "M", "G"],
  availableToppings: [],
};

describe("ProductCard", () => {
  it("exibe nome, descrição e preço formatado do produto", () => {
    render(<ProductCard product={pizza} onSelect={() => {}} />);
    expect(screen.getByText("Calabresa")).toBeInTheDocument();
    expect(
      screen.getByText("Molho, mussarela, calabresa fatiada, cebola e orégano")
    ).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*39,90/)).toBeInTheDocument();
  });

  it("usa o nome do produto como alt da imagem (acessibilidade)", () => {
    render(<ProductCard product={pizza} onSelect={() => {}} />);
    expect(screen.getByRole("img", { name: "Calabresa" })).toBeInTheDocument();
  });

  it("chama onSelect com o id do produto ao clicar", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<ProductCard product={pizza} onSelect={onSelect} />);
    await user.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("1");
  });
});