const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const { login, logout } = require('./auth');
const { authenticateToken, authorizeRoles } = require('./middleware');
const loans = require('./data').loans;

const app = express();

app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors());

// Login and Logout Endpoints
app.post('/login', login);
app.post('/logout', authenticateToken, logout);

// Fetch all loans
app.get('/loans', authenticateToken, (req, res) => {
  if (req.user.role === 'admin' || req.user.role === 'superAdmin') {
    return res.status(200).json(loans);
  } else if (req.user.role === 'staff') {
    const filteredLoans = loans.map(loan => {
      const { totalLoan, ...applicant } = loan.applicant;
      return {
        ...loan,
        applicant
      };
    });
    return res.status(200).json(filteredLoans);
  } else {
    return res.status(403).json({ message: 'Access denied' });
  }
});

// Filter loans based on status
app.get('/loans', authenticateToken, (req, res) => {
  const { status } = req.query;
  if (!status) {
    return res.status(400).json({ message: 'Status query parameter is required' });
  }
  const filteredLoans = loans.filter(loan => loan.status === status);
  res.status(200).json(filteredLoans);
});

// Fetch loans by user email
app.get('/loans/:userEmail/get', authenticateToken, (req, res) => {
  const { userEmail } = req.params;
  const userLoans = loans.filter(loan => loan.applicant.email === userEmail);
  res.status(200).json({ loans: userLoans });
});

// Fetch expired loans
app.get('/loans/expired', authenticateToken, (req, res) => {
  const now = new Date();
  const expiredLoans = loans.filter(loan => new Date(loan.maturityDate) < now);
  res.status(200).json(expiredLoans);
});

// Delete a loan (SuperAdmin only)
app.delete('/loan/:loanId/delete', authenticateToken, authorizeRoles('superAdmin'), (req, res) => {
  const { loanId } = req.params;
  const loanIndex = loans.findIndex(loan => loan.id === loanId);
  if (loanIndex === -1) {
    return res.status(404).json({ message: 'Loan not found' });
  }
  loans.splice(loanIndex, 1);
  res.status(200).json({ message: 'Loan deleted successfully' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong', error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
