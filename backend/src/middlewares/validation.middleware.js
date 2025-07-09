const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  console.log('Validating request:', {
    path: req.path,
    method: req.method,
    body: req.body
  });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors found:', errors.array());
    
    // Format errors for better client-side handling
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));
    
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: formattedErrors
    });
  }

  console.log('Validation passed');
  next();
};

module.exports = validate; 