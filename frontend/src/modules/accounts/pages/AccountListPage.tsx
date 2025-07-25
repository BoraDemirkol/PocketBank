import { useAccounts } from "../hooks/useAccounts";
import { AccountCard } from "../components/AccountCard";
import "../../../modules/accounts/styles/AccountStyles.css";
const AccountListPage = () => {
  const { accounts, loading, error } = useAccounts();

  if (loading) return <p>Yükleniyor...</p>;
  if (error) return <p>Hata: {error}</p>;

  return (
    <div>
      <h1>Hesaplar</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {accounts.map((acc) => (
          <AccountCard key={acc.id} account={acc} />
        ))}
      </div>
    </div>
  );
};

export default AccountListPage;
