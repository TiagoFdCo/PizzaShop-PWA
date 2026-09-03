import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, Truck, ArrowRight, Flame, Star } from "lucide-react";
import { useTenantStore } from "../../store/useTenantStore";

export function LandingPage() {
  const navigate = useNavigate();
  const tenant = useTenantStore((state) => state.tenant);

  const heroStyle = tenant?.bannerUrl
    ? { "--hero-image": `url(${tenant.bannerUrl})` } as CSSProperties
    : undefined;

  return (
    <div className="landing-page">
      <section className="hero-modern" style={heroStyle}>
        <div className="hero-content">
          {tenant?.logoUrl && <img src={tenant.logoUrl} alt={tenant.name} className="hero-logo" />}
          <div className="hero-eyebrow">Feita para você</div>
          <h1 className="hero-title">{tenant?.name ?? "Pizza quentinha, do jeito que você quer"}</h1>
          <p className="hero-text">
            {tenant?.tagline || "Monte sua pizza com os ingredientes que você gosta e acompanhe o pedido em tempo real."}
          </p>
          <button onClick={() => navigate("/cardapio")} className="btn-primary">
            Ver cardápio <ArrowRight size={18} className="ml-2" />
          </button>
        </div>
      </section>

      {tenant?.aboutText && (
        <section className="story-section">
          <div className="story-kicker">Nossa história</div>
          <h2 className="story-title">Sabor que começa nos detalhes</h2>
          <p className="story-text">{tenant.aboutText}</p>
        </section>
      )}

      {tenant && (
        <section className="info-section" aria-label="Informações da loja">
          <div className="info-grid">
            <div className="info-card">
              <span className="info-icon"><MapPin size={20} /></span>
              <div>
                <p className="info-card-title">Onde estamos</p>
                <p className="info-card-text">{tenant.address}</p>
              </div>
            </div>
            <div className="info-card">
              <span className="info-icon"><Clock size={20} /></span>
              <div>
                <p className="info-card-title">Horário</p>
                <p className="info-card-text">{tenant.openingHours}</p>
              </div>
            </div>
            <div className="info-card">
              <span className="info-icon"><Truck size={20} /></span>
              <div>
                <p className="info-card-title">Entrega</p>
                <p className="info-card-text">Raio de {tenant.deliveryRadiusKm} km · ~{tenant.avgPrepTimeMin} min de preparo</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto w-[min(1080px,calc(100%-40px))] pb-20">
        <div className="pizza-gradient rounded-[24px] px-7 py-8 shadow-[0_20px_50px_rgba(58,29,19,.14)] md:flex md:items-center md:justify-between md:gap-8 md:px-10">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.14em] text-[#f5dca8]">
              <Flame size={15} /> Feita na hora
            </div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">Seu próximo pedaço começa aqui.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Massa de longa fermentação, ingredientes selecionados e forno quente para chegar à sua mesa do jeito certo.</p>
          </div>
          <button onClick={() => navigate("/cardapio")} className="mt-6 inline-flex shrink-0 items-center justify-center gap-2 rounded-[14px] bg-white px-5 py-3 text-sm font-extrabold text-[#7c1c17] shadow-lg md:mt-0">
            Escolher minha pizza <ArrowRight size={17} />
          </button>
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-[#8b7c74]">
          <Star size={14} className="fill-current text-[#d3a24c]" /> Experiência artesanal, do forno à sua porta.
        </div>
      </section>
    </div>
  );
}
