import { ThemeEditor } from "../../components/admin/ThemeEditor";
import { PaymentMethodsToggle } from "../../components/admin/PaymentMethodsToggle";

export function CustomizationPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customização da Loja</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure a identidade visual, contato e regras de operação da sua pizzaria.
        </p>
      </div>
      <ThemeEditor />
      <PaymentMethodsToggle />
    </div>
  );
}