import PropTypes from 'prop-types';
import "./confirmDialog.css";

const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="confirmDialog">
      <p>{message}</p>
      <div className="buttonContainer">
        <button onClick={() => onConfirm(true)}>Yes</button>
        <button onClick={onCancel}>No</button>
      </div>
    </div>
  );
};

ConfirmDialog.propTypes = {
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ConfirmDialog;

