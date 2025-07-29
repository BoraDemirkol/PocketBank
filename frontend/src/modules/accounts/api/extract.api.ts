import api from "../../../Shared/api/axios";

export const downloadExtractPdf = async (
  accountId: string,
  year: number,
  month: number
): Promise<void> => {
  const response = await api.get(`/transactions/extractPdf`, {
    params: { accountId, year, month },
    responseType: "blob", 
  });

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `ekstre-${year}-${month}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
