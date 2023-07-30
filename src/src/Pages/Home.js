import React from "react";
import axios from "axios";

export default function Home() {
  const paymentRequest = {
    amount: 1,
    merchantInvoiceNumber: "01848189974",
    intent: "sale",
  };

  const createRequest = async function () {
    try {
      const { data } = await axios.post(
        `http://localhost:5000/createPayment`,
        paymentRequest
      );
      window.location.href = data.bkashURL;
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "calc(100vh-200px)",
      }}
    >
      <button
        className="btn btn-success btn-lg mt-4 h2"
        onClick={createRequest}
      >
        Payment
      </button>
    </div>
  );
}
