import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Execute() {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentID = urlParams.get("paymentID");
  const status = urlParams.get("status");
  const [response, setResponse] = useState({});

  const paymentExecute = async () => {
    return await axios.post(
      `http://localhost:5000/executePayment?paymentID=${paymentID}&status=${status}`
    );
  };

  useEffect(() => {
    paymentExecute()
      .then((response) => {
        setResponse(response.data);
      })
      .catch((err) => {
        console.log(err);
        // you can redirect a failed page
      });
  }, []);

  return response ? JSON.stringify(response) : "Loading ...";
}
