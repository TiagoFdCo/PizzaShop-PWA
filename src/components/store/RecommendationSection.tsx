import { useNavigate } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import {
  getLastOrderRecommendations,
  getWeekdayRecommendations,
} from "../../services/recommendationService";
import { useCustomerAuthStore } from "../../store/useCustomerAuthStore";
import { RecommendationCard } from "./RecommendationCard";

export function RecommendationSection() {
  const navigate = useNavigate();

  const isAuthenticated = useCustomerAuthStore(
    (state) => state.isAuthenticated
  );

  const { data: weekdayRecommendations } = useFetch(
    getWeekdayRecommendations,
    []
  );

  const { data: lastOrderRecommendations } = useFetch(
    () =>
      isAuthenticated
        ? getLastOrderRecommendations()
        : Promise.resolve([]),
    [isAuthenticated]
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      {isAuthenticated &&
        lastOrderRecommendations &&
        lastOrderRecommendations.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Do seu último pedido
            </h2>

            <p className="text-sm text-gray-500 mb-4">
              Que tal pedir novamente?
            </p>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {lastOrderRecommendations.map((product) => (
                <RecommendationCard
                  key={product.id}
                  product={product}
                  onSelect={(id) => navigate(`/produto/${id}`)}
                />
              ))}
            </div>
          </div>
        )}

      {weekdayRecommendations && weekdayRecommendations.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Mais pedidos hoje
          </h2>

          <p className="text-sm text-gray-500 mb-4">
            Sugestões baseadas nos pedidos deste dia da semana.
          </p>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {weekdayRecommendations.map((product) => (
              <RecommendationCard
                key={product.id}
                product={product}
                onSelect={(id) => navigate(`/produto/${id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}