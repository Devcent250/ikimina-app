import React, { useEffect, useState } from "react";
import axios from "axios";

const ContributionsReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [contributions, setContributions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/contributions", {
          params: { page_size: 50, page: 1 },
        });
        setContributions(response.data.results || []);
      } catch (err: any) {
        setError("Failed to load contributions report.");
      } finally {
        setLoading(false);
      }
    };
    fetchContributions();
  }, []);

  return (
    <div className= "p-6" >
    <h1 className="text-2xl font-bold mb-4" > Contributions Report </h1>
  {
    loading ? (
      <div>Loading...</div>
      ) : error ? (
  <div className= "text-red-500" > { error } </div>
      ) : contributions.length === 0 ? (
  <div>No contributions found.</div>
      ) : (
  <table className= "min-w-full bg-white border" >
  <thead>
  <tr>
  <th className="px-4 py-2 border" > Date </th>
    < th className = "px-4 py-2 border" > Member </th>
      < th className = "px-4 py-2 border" > Group </th>
        < th className = "px-4 py-2 border" > Deposit Amount </th>
          < th className = "px-4 py-2 border" > Solidarity Amount </th>
            < th className = "px-4 py-2 border" > Payment Method </th>
              </tr>
              </thead>
              <tbody>
{
  contributions.map((c: any) => (
    <tr key= { c.id } >
    <td className="px-4 py-2 border" > { c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "-" } </td>
  < td className = "px-4 py-2 border" > { c.member?.firstName || "-" } { c.member?.lastName || "" } </td>
  < td className = "px-4 py-2 border" > { c.group?.name || "-" } </td>
  < td className = "px-4 py-2 border" > { c.depositAmount } </td>
  < td className = "px-4 py-2 border" > { c.solidarityAmount } </td>
  < td className = "px-4 py-2 border" > { c.paymentMethod?.name || "-" } </td>
  </tr>
  ))
}
</tbody>
  </table>
      )}
</div>
  );
};

export default ContributionsReport;
