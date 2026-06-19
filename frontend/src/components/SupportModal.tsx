import { useEffect, useState } from "react";
import {
  checkTipsBilling,
  isTipsAvailableOnDevice,
  loadTipProducts,
  purchaseTip,
  type TipProduct,
} from "../donations/tipsService";

interface SupportModalProps {
  onClose: () => void;
}

export function SupportModal({ onClose }: SupportModalProps) {
  const [products, setProducts] = useState<TipProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      setMessage("");

      if (!isTipsAvailableOnDevice()) {
        if (!cancelled) {
          setError("Tips are available in the Android app installed from Google Play.");
          setLoading(false);
        }
        return;
      }

      const supported = await checkTipsBilling();
      if (!supported) {
        if (!cancelled) {
          setError("Google Play billing is not available on this device.");
          setLoading(false);
        }
        return;
      }

      try {
        const loaded = await loadTipProducts();
        if (cancelled) return;
        if (!loaded.length) {
          setError(
            "No tip products loaded. Create and activate tip_small in Play Console (tip_medium and tip_large are optional), then reinstall from the internal test link.",
          );
        } else {
          setProducts(loaded);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load tip options.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const buy = async (productId: string) => {
    setBuying(productId);
    setError("");
    setMessage("");
    try {
      await purchaseTip(productId);
      setMessage("Thank you for your support!");
    } catch (e) {
      const text = e instanceof Error ? e.message : "Purchase could not be completed.";
      if (!/cancel/i.test(text)) {
        setError(text);
      }
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <h2>Donations</h2>
        <p className="hint">
          Optional tips help support development. They do not unlock features — the app stays fully
          free.
        </p>

        {loading && <p className="empty">Loading tip options…</p>}
        {error && <div className="error-banner">{error}</div>}
        {message && <div className="success-banner">{message}</div>}

        {!loading && products.length > 0 && (
          <div className="tip-list">
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                className="btn tip-btn"
                onClick={() => buy(product.id)}
                disabled={buying !== null}
              >
                <span className="tip-title">{product.title}</span>
                <span className="tip-price">{product.price}</span>
              </button>
            ))}
          </div>
        )}

        <div className="btn-row" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ marginLeft: "auto" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
