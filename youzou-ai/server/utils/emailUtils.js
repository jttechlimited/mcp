const nodemailer = require('nodemailer');
const { logger } = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

async function sendVerificationEmail(email, token) {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    
    const mailOptions = {
      from: `"遊走 AI" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '驗證您的電子郵件地址 - 遊走 AI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>電子郵件驗證 - 遊走 AI</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2196F3, #9C27B0); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">遊走 AI</h1>
              <p style="color: white; margin: 10px 0 0 0;">您的智能旅遊助手</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #2196F3;">歡迎加入遊走 AI！</h2>
              
              <p>親愛的用戶，</p>
              
              <p>感謝您註冊遊走 AI！為了確保您的帳戶安全，請點擊下方的按鈕來驗證您的電子郵件地址：</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: linear-gradient(135deg, #2196F3, #9C27B0); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          display: inline-block; 
                          font-weight: bold;">
                  驗證電子郵件地址
                </a>
              </div>
              
              <p>如果按鈕無法點擊，請複製以下連結到瀏覽器中：</p>
              <p style="word-break: break-all; color: #2196F3;">${verificationUrl}</p>
              
              <p><strong>此驗證連結將在24小時後過期。</strong></p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #666;">
                如果您沒有註冊遊走 AI，請忽略此電子郵件。
              </p>
              
              <p style="font-size: 12px; color: #666;">
                如有任何問題，請聯繫我們的客服團隊：info@jttech.hk
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent to: ${email}`);
    
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    throw error;
  }
}

async function sendPasswordResetEmail(email, token) {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
    const mailOptions = {
      from: `"遊走 AI" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '重設您的密碼 - 遊走 AI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>重設密碼 - 遊走 AI</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2196F3, #9C27B0); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">遊走 AI</h1>
              <p style="color: white; margin: 10px 0 0 0;">您的智能旅遊助手</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #2196F3;">重設密碼</h2>
              
              <p>親愛的用戶，</p>
              
              <p>我們收到了您重設密碼的請求。請點擊下方的按鈕來重設您的密碼：</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(135deg, #2196F3, #9C27B0); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          display: inline-block; 
                          font-weight: bold;">
                  重設密碼
                </a>
              </div>
              
              <p>如果按鈕無法點擊，請複製以下連結到瀏覽器中：</p>
              <p style="word-break: break-all; color: #2196F3;">${resetUrl}</p>
              
              <p><strong>此重設連結將在1小時後過期。</strong></p>
              
              <p style="background: #fff3cd; padding: 15px; border-radius: 5px; color: #856404;">
                <strong>安全提醒：</strong>如果您沒有要求重設密碼，請忽略此電子郵件，您的帳戶將保持安全。
              </p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #666;">
                如有任何問題，請聯繫我們的客服團隊：info@jttech.hk
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to: ${email}`);
    
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    throw error;
  }
}

async function sendAutoCheckerNotification(email, searchData, priceChanges) {
  try {
    const mailOptions = {
      from: `"遊走 AI" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '價格變動通知 - 遊走 AI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>價格變動通知 - 遊走 AI</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2196F3, #9C27B0); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">遊走 AI</h1>
              <p style="color: white; margin: 10px 0 0 0;">您的智能旅遊助手</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #2196F3;">價格變動通知</h2>
              
              <p>親愛的用戶，</p>
              
              <p>您關注的旅遊產品價格發生了變動：</p>
              
              <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #2196F3; margin-top: 0;">搜索詳情</h3>
                <p><strong>出發地：</strong> ${searchData.origin}</p>
                <p><strong>目的地：</strong> ${searchData.destination}</p>
                <p><strong>出發日期：</strong> ${searchData.departureDate}</p>
                ${searchData.returnDate ? `<p><strong>返回日期：</strong> ${searchData.returnDate}</p>` : ''}
              </div>
              
              <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #4CAF50; margin-top: 0;">價格變動</h3>
                ${priceChanges.map(change => `
                  <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px;">
                    <strong>${change.type === 'flight' ? '航班' : '酒店'}:</strong> 
                    ${change.name} - 
                    <span style="color: ${change.priceChange < 0 ? '#4CAF50' : '#f44336'};">
                      ${change.priceChange < 0 ? '↓' : '↑'} 
                      HK$${Math.abs(change.priceChange).toFixed(2)}
                    </span>
                    <br>
                    <small>當前價格: HK$${change.currentPrice.toFixed(2)}</small>
                  </div>
                `).join('')}
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/search-history" 
                   style="background: linear-gradient(135deg, #2196F3, #9C27B0); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          display: inline-block; 
                          font-weight: bold;">
                  查看詳情
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #666;">
                如有任何問題，請聯繫我們的客服團隊：info@jttech.hk
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Auto-checker notification sent to: ${email}`);
    
  } catch (error) {
    logger.error('Failed to send auto-checker notification:', error);
    throw error;
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAutoCheckerNotification
};