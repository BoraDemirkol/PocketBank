import { useState } from "react";
import { createAccount } from "../api/account.api";
import { Account } from "../types/account";

const initialAccount: Omit<Account, "id"> = {
  userId: "00000000-0000-0000-0000-000000000001",
  accountName: "",
  accountType: "Vadesiz",
  balance: 0,
  currency: "TRY"
};

export const AccountForm = () => {
  const [formData, setFormData] = useState(initialAccount);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "balance" ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAccount(formData);
    alert("Hesap başarıyla oluşturuldu!");
    window.location.reload(); // veri tekrar yüklensin
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
      <h2>Yeni Hesap Oluştur</h2>

      <input
        type="text"
        name="accountName"
        placeholder="Hesap adı"
        value={formData.accountName}
        onChange={handleChange}
        required
      />

      <select name="accountType" value={formData.accountType} onChange={handleChange}>
        <option value="Vadesiz">Vadesiz</option>
        <option value="Vadeli">Vadeli</option>
        <option value="Kredi Kartı">Kredi Kartı</option>
      </select>

      <input
        type="number"
        name="balance"
        placeholder="Bakiye"
        value={formData.balance}
        onChange={handleChange}
        required
      />

      <input
        type="text"
        name="currency"
        placeholder="Para birimi (TRY/USD)"
        value={formData.currency}
        onChange={handleChange}
        required
      />

      <button type="submit">Hesap Ekle</button>
    </form>
  );
};
