import React, { useState } from "react";
import { downloadStatementPdf } from "../api/transaction.api.ts";

interface Props {
  accountId: string;
  onClose: () => void;
}

const StatementModal: React.FC<Props> = ({ accountId, onClose }) => {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const handleDownload = async () => {
    if (!start || !end) {
      alert("Lütfen başlangıç ve bitiş tarihi seçin");
      return;
    }
    try {
      await downloadStatementPdf(accountId, start, end);
      onClose();
    } catch {
      alert("Ekstre indirilirken hata oluştu");
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>📄 Ekstre İndir</h2>
        <label>Başlangıç Tarihi:</label>
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <label>Bitiş Tarihi:</label>
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
        <div style={{ marginTop: "1rem" }}>
          <button onClick={handleDownload}>İndir</button>
          <button onClick={onClose} style={{ marginLeft: "0.5rem" }}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatementModal;
