import React, { useEffect, useState } from "react";
import { fetchAccounts, createAccount as apiCreate } from "../api/account.api.ts";
import type { Account } from "../types/account";
import TransactionModal from "../components/TransactionModal.tsx";
import StatementModal from "../components/StatementModal.tsx";
import "../styles/AccountStyles.css";
import { fetchExchangeRates } from "../api/currencyRates.ts";

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
  const [showStatementFor, setShowStatementFor] = useState<string | null>(null);

  const [rates, setRates] = useState<Record<string, number>>({});
  const [currencies, setCurrencies] = useState<number[]>([]);
  const currencyIcons = ["₺", "$", "€"];
  const currencyMap = ["TRY", "USD", "EUR"];
  const cardWidth = "250px";

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
    const interval = setInterval(getRates, 30000);
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
    <div className="account-container">
      <h2 className="module-title">🏦 Hesap Yönetimi</h2>

      {/* Yeni Hesap Kartı */}
      <div className="create-card">
        <h3>✨ Yeni Hesap Oluştur</h3>
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
        {error && <p style={{ color: "#ef4444" }}>{error}</p>}
        <button onClick={createAccount}>➕ Hesap Oluştur</button>
      </div>

      {/* Filtre */}
      <div className="account-filter">
        <h3>📊 Hesaplarım</h3>
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

      {/* Hesap Listesi */}
      {filteredAccounts.length === 0 ? (
        <p>Seçilen türde hesap bulunamadı.</p>
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
                    style={{ position: "absolute", top: 12, right: 12 }}
                  >
                    {currencyIcons[currencies[idx] || 0]}
                  </button>
                  <h4>{account.accountName}</h4>
                  <p><strong>Tür:</strong> {account.accountType}</p>
                  <p>
                    <strong>Bakiye:</strong>{" "}
                    {account.balance.toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                    })} ₺
                  </p>
                  {selectedCurrency !== "TRY" && rates[selectedCurrency] && (
                    <p>
                      <strong>{selectedCurrency} Karşılığı:</strong>{" "}
                      {(account.balance * rates[selectedCurrency]).toFixed(2)}{" "}
                      {selectedCurrency}
                    </p>
                  )}
                  <div className="account-card-buttons">
                    <button onClick={() => setShowHistoryFor(account.id)}>
                      📈 Geçmiş
                    </button>
                    <button onClick={() => setShowStatementFor(account.id)}>
                      📄 Ekstre
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modaller */}
      {showHistoryFor && (
        <TransactionModal
          accountId={showHistoryFor}
          onClose={() => setShowHistoryFor(null)}
        />
      )}

      {showStatementFor && (
        <StatementModal
          accountId={showStatementFor}
          onClose={() => setShowStatementFor(null)}
        />
      )}
    </div>
  );
};

export default AccountListPage;
