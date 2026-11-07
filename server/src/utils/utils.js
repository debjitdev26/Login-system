export function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}
export function getOtpHtml(otp) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>OTP Verification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 500px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    h2 {
      color: #333333;
      text-align: center;
    }
    .otp-box {
      background: #007bff;
      color: #ffffff;
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      letter-spacing: 4px;
    }
    p {
      color: #555555;
      font-size: 14px;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #999999;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Email Verification</h2>
    <p>Dear User,</p>
    <p>Use the following One-Time Password (OTP) to complete your verification process. This OTP is valid for 10 minutes.</p>
    
    <div class="otp-box">
      ${otp}
    </div>
    
    <p>If you did not request this, please ignore this email.</p>
    
  </div>
</body>
</html>
`
}