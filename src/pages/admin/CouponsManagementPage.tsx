// Fase 4 (P3) — gestão de cupons no painel admin (/admin/cupons)
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createCoupon, deleteCoupon, getCoupons, updateCoupon } from "../../services/couponService";
import { CouponForm } from "../../components/admin/coupons/CouponForm";
import { toCouponInput, type CouponFormData } from "../../lib/couponForm";
import { CouponTable } from "../../components/admin/coupons/CouponTable";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import type { Coupon } from "../../types/loyalty";

export function CouponsManagementPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    getCoupons()
      .then(setCoupons)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setFormError(null);
    setModalOpen(true);
  }

  async function handleCreate(data: CouponFormData) {
    setFormError(null);
    try {
      const created = await createCoupon(toCouponInput(data));
      setCoupons((list) => [created, ...list]);
      setModalOpen(false);
    } catch (e) {
      // ex.: "Já existe um cupom com este código"
      setFormError((e as Error).message);
    }
  }

  async function handleToggle(coupon: Coupon) {
    setBusyId(coupon.id);
    try {
      const updated = await updateCoupon(coupon.id, { active: !coupon.active });
      setCoupons((list) => list.map((c) => (c.id === updated.id ? updated : c)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(coupon: Coupon) {
    const warning =
      coupon.usesCount > 0
        ? `O cupom ${coupon.code} já foi usado ${coupon.usesCount} vez(es). Os pedidos antigos continuam com o desconto. Excluir mesmo assim?`
        : `Excluir o cupom ${coupon.code}?`;
    if (!confirm(warning)) return;
    setBusyId(coupon.id);
    try {
      await deleteCoupon(coupon.id);
      setCoupons((list) => list.filter((c) => c.id !== coupon.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cupons de desconto</h1>
          <p className="text-sm text-gray-500">
            O cliente digita o código no checkout. Desconto vale só sobre os produtos, nunca sobre a entrega.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1" /> Novo cupom
        </Button>
      </div>

      {loading && <Spinner label="Carregando cupons..." />}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && (
        <CouponTable coupons={coupons} busyId={busyId} onToggle={handleToggle} onDelete={handleDelete} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo cupom">
        <CouponForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} serverError={formError} />
      </Modal>
    </div>
  );
}
