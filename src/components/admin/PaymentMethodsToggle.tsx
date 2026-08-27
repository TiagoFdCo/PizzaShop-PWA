import { useTenantStore } from "../../store/useTenantStore";
import type { PaymentMethod } from "../../types/tenant";

const ALL_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "dinheiro", label: "Dinheiro" },
];

export function PaymentMethodsToggle() {
  const tenant = useTenantStore((state) => state.tenant);
  const saveTenant = useTenantStore((state) => state.saveTenant);

  if (!tenant) return null;

  function toggleMethod(method: PaymentMethod) {
    if (!tenant) return;
    const isEnabled = tenant.enabledPaymentMethods.includes(method);
    const updated = isEnabled
      ? tenant.enabledPaymentMethods.filter((m) => m !== method)
      : [...tenant.enabledPaymentMethods, method];

    saveTenant({ ...tenant, enabledPaymentMethods: updated });
  }

  return (
    <div className="card space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">Formas de Pagamento</h2>
      <p className="text-sm text-gray-500">
        Apenas as formas habilitadas aqui aparecem no checkout da loja.
      </p>

      <div className="flex flex-col gap-2">
        {ALL_METHODS.map(({ value, label }) => {
          const checked = tenant.enabledPaymentMethods.includes(value);
          return (
            <label key={value} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleMethod(value)}
                className="h-4 w-4 accent-primary"
              />
              {label}
            </label>
          );
        })}
      </div>
    </div>
  );
}
