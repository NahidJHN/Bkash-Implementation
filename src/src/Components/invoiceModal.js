//External Lib Import
import axios from "axios";
import moment from "moment";
import React, { useEffect, useState } from "react";

//Internal Lib Import
import { SERVER_URL } from "../../../config/config";
import store from "../../../store";
import "../addStoreModal.css";

const SSInvoiceModal = ({ ssInvoice, invoiceFlag, isInvoiceModalOpen, closeModal }) => {
  const [modalOpenFlag, setModalOpenFlag] = useState(isInvoiceModalOpen);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(store.getState().admin.isLoggedIn);
  }, [store]);

  useEffect(() => {
    setModalOpenFlag(isInvoiceModalOpen);
  }, [isInvoiceModalOpen]);

  const bKash = window.bkash;

  useEffect(() => {
    let paymentID = "";
    if (ssInvoice) {
      bKash.init({
        paymentMode: "checkout", //fixed value ‘checkout’
        paymentRequest: {
          amount: ssInvoice.amount,
          merchantInvoiceNumber: ssInvoice.invoiceNumber,
          intent: "sale"
        },
        createRequest: async function (request) {
          try {
            const { data } = await axios.post(
              `${SERVER_URL}/api/shunno-it/invoiceCreatePayment/${ssInvoice?.store}/${ssInvoice?._id}`,
              request
            );
            if (data?.data?.paymentID) {
              paymentID = data?.data?.paymentID;
              bKash.create().onSuccess(data?.data);
            } else {
              bKash.create().onError();
              //window.location.href = "/payment-failed";
            }
          } catch (error) {
            bKash.create().onError();
            //window.location.href = "/payment-failed";
          }
        },
        executeRequestOnAuthorization: async function () {
          const body = { invoiceID: ssInvoice._id };
          try {
            const { data } = await axios.post(
              `${SERVER_URL}/api/shunno-it/invoicePaid/${ssInvoice?.store}/${ssInvoice?._id}/${paymentID}`,
              body
            );
            if (data?.data.status === "paid") {
              window.location.href = "/payment-success";
            } else {
              window.location.href = "/payment-failed";
              bKash.execute().onError();
            }
          } catch (error) {
            bKash.execute().onError();
            window.location.href = "/payment-failed";
            // console.log(error);
          }
        }
      });
    }
  }, [ssInvoice]);

  if (ssInvoice && !isAdmin) {
    return (
      <div
        className={`customModal ${invoiceFlag === "EXPIRED" || modalOpenFlag ? "activeModal" : ""
          }`}
      >
        <div className="customModalBody">
          <div className="container">
            <h1 className="text-center text-success text-success">
              মাসিক বিলঃ {ssInvoice.amount} TK
            </h1>
            <h3 className="text-center text-success text-uppercase">
              পরিশোধের শেষ সময়ঃ
              <span className="text-danger">
                {/* 7-{new Date().getMonth() + 1}-{new Date().getFullYear()} */}
                {moment(ssInvoice.dueDate).format("DD-MM-YYYY")}
              </span>
            </h3>
            <div className="mt-5 mb-5">
              <img
                className="w-100"
                src="/assets/img/bkash_payment_logo.png"
                alt=""
              />
            </div>
            {/* 
          <div className="form-check h4">
            <input
              className="form-check-input"
              type="checkbox"
              name=""
              id="agreeTerms"
              checked={agreement}
              onChange={e => setAgreement(e.target.checked)}
            />
            <label htmlFor="agreeTerms" className="form-check-label">
              I read and agree to the Terms & Conditions , Privacy Policy and
              Return & Refund Policy
            </label>
          </div> */}
            <div className="text-center">
              {invoiceFlag !== "EXPIRED" && (
                <button
                  onClick={closeModal}
                  className="btn btn-danger btn-lg mt-4 mr-4"
                >
                  Cancel
                </button>
              )}

              <button
                // disabled={!agreement}
                className="btn btn-success btn-lg mt-4 h2"
                // onClick={handlePayment}
                id="bKash_button"
              >
                Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return "";
};
export default SSInvoiceModal;
