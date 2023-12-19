import React from 'react';

const IncomingCallPopup = ({ callerName, onAccept, onReject }) => {
  return (
    <div className="incoming-call-popup">
      <p>{callerName} is calling...</p>
      <div className="d-flex">
        <button onClick={onAccept} className='me-3 btn btn-primary'>Accept</button>
        <button onClick={onReject} className='btn btn-danger'>Reject</button>
      </div>
    </div>
  );
};

export default IncomingCallPopup;
