import axios from "axios";
import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Execute from "./Pages/ExecutePayment";
import Home from "./Pages/Home";

export default function App() {
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
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/executePayment" element={<Execute />} />
    </Routes>
  );
}
