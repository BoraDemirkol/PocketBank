import React, { useEffect, useState } from "react";
import Layout from "../../../layout/Layout";
import { fetchAccounts, createAccount as apiCreate } from "../api/account.api";
import { Account } from "../types/account";
import TransactionModal from "../components/TransactionModal";
import "../styles/AccountStyles.css";
import { downloadExtractPdf } from "../api/extract.api";
import { fetchExchangeRates } from "../api/currencyRates";

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

  const createAccount = async () => {
    if (!name.trim()) return setError("Hesap adı boş olamaz");

    const newAccount: Omit<Account, "id"> = {
      accountName: name,
      accountType: type,
      currency: "TRY",
      balance: 0,
      userId: "00000000-0000-0000-0000-000000000001",
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
        <h2 className="module-title">📁 Modül 2: Account Management</h2>

        <div className="create-card">
          <h3>🆕 Yeni Hesap Oluştur</h3>
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
            <p style={{ color: "red", fontSize: "0.9em", marginBottom: 10 }}>
              {error}
            </p>
          )}
          <button onClick={createAccount}>Hesap Oluştur</button>
        </div>

        <div className="account-filter">
          <h3>📋 Hesaplarım</h3>
          <div className="account-filter-buttons">
            {["All", "Vadesiz", "Vadeli", "Kredi Kartı"].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t as "All" | AccountType)}
                className={selectedType === t ? "active" : ""}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 10 }}>
            <label htmlFor="currency-select">
              <strong>💱 Para Birimi:</strong>
            </label>
            <select
              id="currency-select"
              value={targetCurrency}
              onChange={(e) => setTargetCurrency(e.target.value)}
              style={{ marginLeft: 10 }}
            >
              <option value="TRY">TRY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {filteredAccounts.length === 0 ? (
          <p>Seçilen türde hesap bulunamadı.</p>
        ) : (
          <div
            className="account-card-container"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            <div className="account-card-scroll" id="scroll-container">
              {filteredAccounts.map((account) => (
                <div
                  key={account.id}
                  className="account-card"
                  style={{
                    flex: `0 0 ${cardWidth}`,
                    borderLeft: `5px solid ${
                      account.accountType === "Vadesiz"
                        ? "#667eea"
                        : account.accountType === "Vadeli"
                        ? "#4caf50"
                        : "#e53935"
                    }`,
                  }}
                >
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
                  {rates[targetCurrency] !== undefined ? (
                    <p>
                      <strong>{targetCurrency} Karşılığı:</strong>{" "}
                      {(account.balance * rates[targetCurrency]).toFixed(2)} {targetCurrency}
                    </p>
                  ) : (
                    <p>
                      <strong>{targetCurrency} Karşılığı:</strong> Yükleniyor...
                    </p>
                  )}
                  <div className="account-card-buttons">
                    <button onClick={() => setShowHistoryFor(account.id)}>
                      Geçmiş
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        const year = today.getFullYear();
                        const month = today.getMonth() + 1;
                        downloadExtractPdf(account.id, year, month);
                      }}
                    >
                      Ekstre
                    </button>
                  </div>
                </div>
              ))}
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
