import React, { useEffect, useState } from "react";
import Layout from "../../../layout/Layout";
import { fetchAccounts, createAccount as apiCreate } from "../api/account.api";
import { Account } from "../types/account";
import TransactionModal from "../components/TransactionModal";
import "../styles/AccountStyles.css";
import { downloadExtractPdf } from "../api/extract.api";
import { fetchExchangeRates } from "../api/currencyRates";

// Tip tanımı
type AccountType = "Vadesiz" | "Vadeli" | "Kredi Kartı";

const AccountListPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("Vadesiz");
  const [selectedType, setSelectedType] = useState<"All" | AccountType>("All");
  const [error, setError] = useState("");
  const [hovering, setHovering] = useState(false);
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);
  const [targetCurrency, setTargetCurrency] = useState("USD");
  const [rates, setRates] = useState<Record<string, number>>({});
  const cardWidth = "250px";
  const [currencies, setCurrencies] = useState<number[]>([]);
  const currencyIcons = ["₺", "$", "€"];
  const currencyMap = ["TRY", "USD", "EUR"];

  useEffect(() => {
    fetchAccounts()
      .then(setAccounts)
      .catch(() => setError("Hesaplar yüklenemedi"));
  }, []);

  useEffect(() => {
    const getRates = async () => {
      try {
        const data = await fetchExchangeRates();
        setRates(data.rates);
      } catch (err) {
        console.error("Kur bilgileri alınamadı:", err);
      }
    };

    getRates();
    const interval = setInterval(() => {
      getRates();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrencies(new Array(accounts.length).fill(0));
  }, [accounts.length]);

  const handleCurrencySwitch = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setCurrencies((prev) => {
      const updated = [...prev];
      updated[idx] = (updated[idx] + 1) % currencyIcons.length;
      return updated;
    });
    (e.currentTarget as HTMLButtonElement).blur();
  };

  const createAccount = async () => {
    if (!name.trim()) return setError("Hesap adı boş olamaz");

    const newAccount: Omit<Account, "id"> = {
      accountName: name,
      accountType: type,
      currency: "TRY",
      balance: 0,
      userId: "52a9688d-98ef-4541-a748-a60da44a6ba4",
    };

    try {
      await apiCreate(newAccount);
      const refreshed = await fetchAccounts();
      setAccounts(refreshed);
      setName("");
      setType("Vadesiz");
      setError("");
    } catch {
      setError("Hesap oluşturulamadı");
    }
  };

  const filteredAccounts =
    selectedType === "All"
      ? accounts
      : accounts.filter((a) => a.accountType === selectedType);

  return (
    <Layout>
      <div className="account-container">
        <h2 className="module-title">
          <span style={{ fontSize: "1.8rem" }}>🏦</span>
          Hesap Yönetimi
        </h2>

        <div className="create-card">
          <h3>
            <span style={{ fontSize: "1.2rem" }}>✨</span>
            Yeni Hesap Oluştur
          </h3>
          <label>Hesap Adı:</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: Maaş Hesabı"
          />
          <label>Hesap Türü:</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
          >
            <option value="Vadesiz">Vadesiz</option>
            <option value="Vadeli">Vadeli</option>
            <option value="Kredi Kartı">Kredi Kartı</option>
          </select>
          {error && (
            <p
              style={{
                color: "#ef4444",
                fontSize: "0.9em",
                marginBottom: 10,
                fontWeight: 500,
              }}
            >
              {error}
            </p>
          )}
          <button onClick={createAccount}>
            <span style={{ marginRight: "8px" }}>➕</span>
            Hesap Oluştur
          </button>
        </div>

        <div className="account-filter">
          <h3>
            <span style={{ fontSize: "1.3rem" }}>📊</span>
            Hesaplarım
          </h3>
          <div className="account-filter-buttons">
            {["All", "Vadesiz", "Vadeli", "Kredi Kartı"].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t as "All" | AccountType)}
                className={selectedType === t ? "selected" : ""}
              >
                {t}
              </button>
            ))}
          </div>

          
        </div>

        {filteredAccounts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#64748b",
              fontSize: "1.1rem",
              fontWeight: 500,
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
            Seçilen türde hesap bulunamadı.
          </div>
        ) : (
          <div
            className="account-card-container"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            <div className="account-card-scroll" id="scroll-container">
              {filteredAccounts.map((account, idx) => {
                const selectedCurrency = currencyMap[currencies[idx] || 0];
                return (
                  <div
                    key={account.id}
                    className="account-card"
                    style={{
                      flex: `0 0 ${cardWidth}`,
                      borderLeft: `5px solid ${
                        account.accountType === "Vadesiz"
                          ? "#667eea"
                          : account.accountType === "Vadeli"
                          ? "#10b981"
                          : "#f59e0b"
                      }`,
                      position: "relative",
                    }}
                  >
                    <button
                      className="currency-switch-btn"
                      onClick={(e) => handleCurrencySwitch(e, idx)}
                      style={{ position: "absolute", top: 12, right: 12, zIndex: 20 }}
                      aria-label="Para birimini değiştir"
                      type="button"
                      tabIndex={0}
                    >
                      {currencyIcons[currencies[idx] || 0]}
                    </button>
                    <h4>{account.accountName}</h4>
                    <p>
                      <strong>Tür:</strong> {account.accountType}
                    </p>
                    <p>
                      <strong>Bakiye:</strong>{" "}
                      {account.balance.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ₺
                    </p>
                    {currencyMap[currencies[idx]] !== "TRY" && rates[currencyMap[currencies[idx]]] ? (
                      <p>
                        <strong>{currencyMap[currencies[idx]]} Karşılığı:</strong>{" "}
                        {(account.balance * rates[currencyMap[currencies[idx]]]).toFixed(2)}{" "}
                        {currencyMap[currencies[idx]]}
                      </p>
                    ) : null}
                    <div className="account-card-buttons">
                      <button onClick={() => setShowHistoryFor(account.id)}>
                        📈 Geçmiş
                      </button>
                      <button
                        onClick={() => {
                          const today = new Date();
                          const year = today.getFullYear();
                          const month = today.getMonth() + 1;
                          downloadExtractPdf(account.id, year, month);
                        }}
                      >
                        📄 Ekstre
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredAccounts.length > 4 && (
              <>
                <button
                  onClick={() => {
                    const container = document.getElementById("scroll-container");
                    container?.scrollBy({ left: -300, behavior: "smooth" });
                  }}
                  className={`account-scroll-button ${hovering ? "visible" : ""}`}
                  style={{ left: -10 }}
                >
                  ‹
                </button>
                <button
                  onClick={() => {
                    const container = document.getElementById("scroll-container");
                    container?.scrollBy({ left: 300, behavior: "smooth" });
                  }}
                  className={`account-scroll-button ${hovering ? "visible" : ""}`}
                  style={{ right: -10 }}
                >
                  ›
                </button>
              </>
            )}
          </div>
        )}

        {showHistoryFor && (
          <TransactionModal
            accountId={showHistoryFor}
            onClose={() => setShowHistoryFor(null)}
          />
        )}
      </div>
    </Layout>
  );
};

export default AccountListPage;
