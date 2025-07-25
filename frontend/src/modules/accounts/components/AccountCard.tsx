import { Account } from "../types/account";

interface Props {
  account: Account;
}

export const AccountCard = ({ account }: Props) => {
  return (
    <div style={{
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "1rem",
      width: "250px",
      backgroundColor: "#f9f9f9"
    }}>
      <h3>{account.accountName}</h3>
      <p><strong>Tür:</strong> {account.accountType}</p>
      <p><strong>Bakiye:</strong> {account.balance} {account.currency}</p>
      <p style={{ fontSize: "0.8rem", color: "#666" }}>
        Kullanıcı ID: {account.userId}
      </p>
    </div>
  );
};
