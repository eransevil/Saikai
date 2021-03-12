import React, { useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const emailRef = useRef();
  const { resetPassword } = useAuth();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (emailRef.current.value === 'demo@saikai.com') {
      setLoading(false);
      return setError('Can not reset Demo password! 😉');
    }

    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(emailRef.current.value);
      setMessage('Check your inbox for further instructions');
    } catch {
      setError(error.message);
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <>
      <div className='card'>
        <div className='card-body'>
          <h2 className='text-center mb-3'>Password Reset</h2>
          {error && (
            <div className='alert alert-danger' role='alert'>
              {error}
            </div>
          )}
          {message && <div className='alert alert-success'>{message}</div>}
          <form onSubmit={handleSubmit}>
            <div className='form-group' id='email'>
              <label htmlFor='email'>Email</label>
              <input
                className='form-control'
                type='email'
                ref={emailRef}
                required
              />
            </div>
            <button
              disabled={loading}
              className='w-100 btn btn-success'
              type='submit'
            >
              Reset Password
            </button>
          </form>
          <div className='w-100 text-center mt-2'>
            <Link to='/login'>Login</Link>
          </div>
        </div>
      </div>
      <div className='w-100 text-center mt-1'>
        Need an account? <Link to='/signup'>Sign Up</Link>
      </div>
    </>
  );
};

export default ForgotPassword;