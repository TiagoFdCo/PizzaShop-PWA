import { useNavigate } from "react-router-dom";
import { MapPin, Clock, Truck } from "lucide-react";
import { useTenantStore } from "../../store/useTenantStore";

export function LandingPage() {
  const navigate = useNavigate();
  const tenant = useTenantStore((state) => state.tenant);

  return (
    <div>
      <section
        className="relative flex flex-col items-center justify-center text-center px-4 py-16"
        style={
          tenant?.bannerUrl
            ? {
                backgroundImage: "linear-gradient(rgba(255,248,240,0.88), rgba(255,248,240,0.95)), url(" + tenant.bannerUrl + ")",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {tenant?.logoUrl && (
          <img src={tenant.logoUrl} alt={tenant.name} className="h-20 w-20 rounded-full object-cover mb-4 shadow-card" />
        )}
        <h1 className="text-4xl font-display font-extrabold text-gray-900 mb-3">
          {tenant?.name ?? "Pizza quentinha, do jeito que você quer"}
        </h1>
        <p className="text-gray-600 max-w-md mb-6">
          {tenant?.tagline ||
            "Monte sua pizza com os ingredientes que você gosta e acompanhe o pedido em tempo real."}
        </p>
        <button onClick={() => navigate("/cardapio")} className="btn-primary">
          Ver cardápio
        </button>
      </section>

      {tenant?.aboutText && (
        <section className="mx-auto max-w-2xl px-4 pb-4 text-center">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Sobre nós</h2>
          <p className="text-gray-600">{tenant.aboutText}</p>
        </section>
      )}

      {tenant && (
        <section className="mx-auto max-w-3xl px-4 pb-16 pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card flex items-start gap-3">
              <MapPin className="mt-0.5 shrink-0 text-primary" size={20} />
              <div>
                <p className="text-sm font-semibold text-gray-800">Endereço</p>
                <p className="text-sm text-gray-500">{tenant.address}</p>
              </div>
            </div>
            <div className="card flex items-start gap-3">
              <Clock className="mt-0.5 shrink-0 text-primary" size={20} />
              <div>
                <p className="text-sm font-semibold text-gray-800">Horário</p>
                <p className="text-sm text-gray-500">{tenant.openingHours}</p>
              </div>
            </div>
            <div className="card flex items-start gap-3">
              <Truck className="mt-0.5 shrink-0 text-primary" size={20} />
              <div>
                <p className="text-sm font-semibold text-gray-800">Entrega</p>
                <p className="text-sm text-gray-500">
                  Raio de {tenant.deliveryRadiusKm} km · ~{tenant.avgPrepTimeMin} min de preparo
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}