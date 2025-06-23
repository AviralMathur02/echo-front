// client/src/components/comingSoonModal/ComingSoonModal.jsx

import React, { useEffect } from "react";
import "./comingSoonModal.scss";
import CloseIcon from "@mui/icons-material/Close";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";

// Accept messageType prop
const ComingSoonModal = ({ setOpenModal, messageType }) => {
  // Determine the message text based on the messageType prop
  const getMessageText = () => {
    switch (messageType) {
      case "sharing":
        return (
          <>
            Sharing feature will be coming soon!
            <br />
            Stay tuned for exciting updates!
          </>
        );
      case "messages":
        return (
          <>
            Message feature will be coming soon!
            <br />
            Stay tuned for exciting updates!
          </>
        );
      default:
        return (
          <>
            This feature will be coming soon!
            <br />
            Stay tuned for exciting updates!
          </>
        );
    }
  };

  // Handle closing the modal when clicking outside or pressing Escape
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape") {
        setOpenModal(false);
      }
    };

    const handleClickOutside = (e) => {
      if (e.target.classList.contains("comingSoonModal")) {
        setOpenModal(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setOpenModal]);

  return (
    <div className="comingSoonModal">
      <div className="wrapper">
        <div className="close-modal-button" onClick={() => setOpenModal(false)}>
          <CloseIcon />
        </div>

        <div className="icon-container">
          <SmartToyOutlinedIcon className="ai-icon" />
        </div>

        <p className="message-text">
          {getMessageText()} {/* Render dynamic message */}
        </p>
      </div>
    </div>
  );
};

export default ComingSoonModal;
