import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BoxyCheck, BoxyAlert } from './BoxyIcons';
import toast from 'react-hot-toast';

const PinModal = ({ isOpen, onClose, onSubmit, title, description, loading }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '']);
      setError(false);
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    setError(false);
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    // Auto-advance
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullPin = pin.join('');
    if (fullPin.length !== 4) {
      setError(true);
      toast.error('PIN must be 4 digits');
      return;
    }
    await onSubmit(fullPin);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-neutral-900 border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl"
          >
            <h2 className="text-2xl font-medium text-white mb-2 text-center">{title}</h2>
            {description && <p className="text-netflixGray text-sm text-center mb-8">{description}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col items-center">
              <div className="flex gap-4 mb-8">
                {pin.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    type="password"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className={`w-14 h-16 text-center text-2xl font-bold rounded-xl bg-white/5 border-2 outline-none transition-all ${
                      error ? 'border-red-500 text-red-500' : 'border-white/10 text-white focus:border-primary'
                    }`}
                    disabled={loading}
                  />
                ))}
              </div>

              <div className="flex gap-4 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || pin.join('').length !== 4}
                  className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-black font-medium transition-colors disabled:opacity-50 disabled:bg-primary/50"
                >
                  {loading ? 'Verifying...' : 'Confirm'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PinModal;
