import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import fs from "fs";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin
try {
  if (!admin.apps.length) {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: firebaseConfig.projectId
      });
      console.log("Firebase Admin initialized with project:", firebaseConfig.projectId);
    } else {
      console.warn("firebase-applet-config.json not found, Firebase Admin might not work correctly.");
    }
  }
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check and Firebase status
  app.get("/api/status", (req, res) => {
    res.json({
      status: "ok",
      firebaseAdmin: admin.apps.length > 0,
      env: {
        hasSmtp: !!process.env.SMTP_HOST,
        hasAdminEmail: !!process.env.ADMIN_EMAIL
      }
    });
  });

  // API route for admin to reset user password
  app.post("/api/admin/reset-password", async (req, res) => {
    const { uid, newPassword } = req.body;

    try {
      if (!admin.apps.length) throw new Error("Firebase Admin not configured");
      await admin.auth().updateUser(uid, {
        password: newPassword
      });
      res.status(200).json({ message: "تم تغيير كلمة المرور بنجاح" });
    } catch (error: any) {
      console.error("Error resetting password:", error);
      res.status(500).json({ 
        error: "فشل تغيير كلمة المرور", 
        details: error.message,
        code: error.code 
      });
    }
  });

  // API route for admin to update their own email and password
  app.post("/api/admin/update-account", async (req, res) => {
    const { uid, newEmail, newPassword } = req.body;
    
    try {
      if (!admin.apps.length) throw new Error("Firebase Admin not configured");
      
      const updateData: any = {};
      if (newEmail) updateData.email = newEmail;
      if (newPassword) updateData.password = newPassword;
      
      if (Object.keys(updateData).length > 0) {
        await admin.auth().updateUser(uid, updateData);
        
        // Also update Firestore if email changed
        if (newEmail) {
          const db = admin.firestore();
          await db.collection("users").doc(uid).set({ email: newEmail }, { merge: true });
        }
      }
      
      res.status(200).json({ message: "تم تحديث الحساب بنجاح" });
    } catch (error: any) {
      console.error("Error updating account:", error);
      res.status(500).json({ 
        error: "فشل تحديث الحساب", 
        details: error.message,
        code: error.code 
      });
    }
  });

  // API route for admin to send password to user
  app.post("/api/admin/send-password-email", async (req, res) => {
    const { email, phone, newPassword, userName } = req.body;

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: `"مركز الدكتور صالح الرداعي" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "كلمة المرور الجديدة الخاصة بك",
        html: `
          <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #0d9488;">مرحباً ${userName || 'عميلنا العزيز'}،</h2>
            <p>بناءً على طلبك، قام المشرف بتغيير كلمة المرور الخاصة بك.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; margin: 20px 0; text-align: center;">
              <p style="margin-bottom: 10px; color: #64748b;">كلمة المرور الجديدة هي:</p>
              <strong style="font-size: 1.5em; color: #0f172a; letter-spacing: 2px;">${newPassword}</strong>
            </div>
            <p>يرجى تسجيل الدخول وتغيير كلمة المرور من إعدادات حسابك لضمان أمان حسابك.</p>
            <p>شكراً لاختيارك مركز الدكتور صالح الرداعي.</p>
          </div>
        `,
      });
      res.status(200).json({ message: "تم إرسال كلمة المرور بنجاح" });
    } catch (error) {
      console.error("Error sending password email:", error);
      res.status(500).json({ error: "فشل إرسال البريد" });
    }
  });

  // API route for admin to generate password reset link
  app.post("/api/admin/generate-reset-link", async (req, res) => {
    const { email } = req.body;

    try {
      const link = await admin.auth().generatePasswordResetLink(email);
      res.status(200).json({ link });
    } catch (error: any) {
      console.error("Error generating reset link:", error);
      res.status(500).json({ 
        error: "فشل إنشاء رابط إعادة التعيين", 
        details: error.message 
      });
    }
  });

  // API route for contact form
  app.post("/api/contact", async (req, res) => {
    const { firstName, lastName, email, phone, message } = req.body;
    console.log(`Received contact message from ${firstName} ${lastName} (${email})`);

    try {
      // Send Email (Only if configured)
      if (process.env.ADMIN_EMAIL && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log(`Sending email to ${process.env.ADMIN_EMAIL}...`);
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"مركز الدكتور صالح الرداعي" <${process.env.SMTP_USER}>`,
          to: process.env.ADMIN_EMAIL,
          subject: `رسالة جديدة من ${firstName} ${lastName}`,
          html: `
            <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #0d9488;">رسالة تواصل جديدة</h2>
              <p>لديك رسالة جديدة من الموقع:</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; margin: 20px 0;">
                <p><strong>الاسم:</strong> ${firstName} ${lastName}</p>
                <p><strong>البريد:</strong> ${email}</p>
                <p><strong>الهاتف:</strong> ${phone}</p>
                <p><strong>الرسالة:</strong></p>
                <p style="white-space: pre-wrap;">${message}</p>
              </div>
              <p>يمكنك الرد على العميل مباشرة عبر بريده الإلكتروني أو هاتفه.</p>
            </div>
          `,
        });
        console.log("Email sent successfully.");
      } else {
        console.warn("SMTP not configured, skipping email notification. Missing vars:", 
          !process.env.ADMIN_EMAIL ? "ADMIN_EMAIL " : "",
          !process.env.SMTP_HOST ? "SMTP_HOST " : "",
          !process.env.SMTP_USER ? "SMTP_USER " : "",
          !process.env.SMTP_PASS ? "SMTP_PASS " : ""
        );
      }

      res.status(200).json({ message: "تم إرسال الرسالة بنجاح" });
    } catch (error: any) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ error: "فشل إرسال الرسالة", details: error.message });
    }
  });

  // API route for appointment confirmation email
  app.post("/api/send-appointment-confirmation", async (req, res) => {
    const { email, userName, message, subject } = req.body;

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: `"مركز الدكتور صالح الرداعي" <${process.env.SMTP_USER}>`,
        to: email,
        subject: subject || "تأكيد موعدك - مركز الدكتور صالح الرداعي",
        html: `
          <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #0d9488;">مرحباً ${userName}،</h2>
            <p>تم تأكيد طلبك في مركزنا بنجاح.</p>
            <div style="background: #f0fdfa; padding: 20px; border-radius: 10px; border: 1px solid #ccfbf1; margin: 20px 0;">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            <p>نتطلع لرؤيتك قريباً.</p>
            <p>شكراً لاختيارك مركزنا.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 0.8em; color: #666;">هذا البريد مرسل تلقائياً، يرجى عدم الرد عليه.</p>
          </div>
        `,
      });
      res.status(200).json({ message: "تم إرسال بريد التأكيد بنجاح" });
    } catch (error) {
      console.error("Error sending appointment confirmation email:", error);
      res.status(500).json({ error: "فشل إرسال بريد التأكيد" });
    }
  });

  // API route for booked slots
  app.get("/api/booked-slots", async (req, res) => {
    try {
      if (!admin.apps.length) throw new Error("Firebase Admin not configured");
      const date = req.query.date as string;
      if (!date) return res.status(400).json({ error: "Date is required" });

      const db = admin.firestore();
      const snapshot = await db.collection("appointments").where("date", "==", date).get();
      const bookedSlots = snapshot.docs
        .map(doc => doc.data())
        .filter(data => data.status !== 'cancelled' && data.status !== 'rejected')
        .map(data => data.time);
      
      res.status(200).json({ slots: bookedSlots });
    } catch (error: any) {
      console.error("Error fetching booked slots:", error);
      res.status(500).json({ error: "فشل جلب المواعيد المحجوزة" });
    }
  });

  // API route for admin to send Firebase push notifications
  app.post("/api/admin/send-notification", async (req, res) => {
    const { title, body, link, recipientUid, type } = req.body;

    try {
      if (!admin.apps.length) throw new Error("Firebase Admin not configured");
      const db = admin.firestore();
      
      // Determine which tokens to fetch
      let tokensSnapshot;
      if (recipientUid) {
        // Send to specific user
        tokensSnapshot = await db.collection("fcm_tokens").where("userId", "==", recipientUid).get();
      } else {
        // Broadcast to all users
        tokensSnapshot = await db.collection("fcm_tokens").get();
      }

      if (tokensSnapshot.empty) {
        return res.status(200).json({ message: "No registered devices found for Notification", sentCount: 0 });
      }

      const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
      
      const payload = {
        notification: {
          title,
          body
        },
        data: {
          url: link || '/',
          type: type || 'broadcast'
        },
        tokens
      };

      const response = await admin.messaging().sendEachForMulticast(payload);
      
      // Optional: Cleanup invalid tokens
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          if (resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code === 'messaging/registration-token-not-registered') {
             // We can delete this token from firestore to maintain clean DB
             db.collection("fcm_tokens").doc(tokens[idx]).delete();
          }
        }
      });

      res.status(200).json({ 
        message: "Notifications dispatched", 
        successCount: response.successCount, 
        failureCount: response.failureCount 
      });
    } catch (error: any) {
      console.error("Error sending push notification:", error);
      res.status(500).json({ 
        error: "فشل إرسال الإشعار", 
        details: error.message 
      });
    }
  });

  // API route to notify users when a product is restocked
  app.post("/api/admin/notify-restock", async (req, res) => {
    const { productId, productName } = req.body;

    try {
      if (!admin.apps.length) throw new Error("Firebase Admin not configured");
      const db = admin.firestore();
      
      // Get all restock requests for this product
      const snapshot = await db.collection("stock_notifications").where("productId", "==", productId).get();
      if (snapshot.empty) {
        return res.status(200).json({ message: "No users waiting for this product" });
      }

      // Collect user UIDs
      const uids = new Set<string>();
      snapshot.docs.forEach(doc => {
        uids.add(doc.data().userId);
      });

      if (uids.size === 0) {
        return res.status(200).json({ message: "No valid users waiting for this product" });
      }

      // Fetch tokens for these users
      const tokens: string[] = [];
      for (const uid of uids) {
        const tokensSnapshot = await db.collection("fcm_tokens").where("userId", "==", uid).get();
        tokensSnapshot.docs.forEach(doc => {
          tokens.push(doc.data().token);
        });
      }

      if (tokens.length === 0) {
        return res.status(200).json({ message: "No valid tokens found for these users" });
      }

      const payload = {
        notification: {
          title: "منتجك المفضل متوفر الآن!",
          body: `لقد تم توفير "${productName}" في عموري للتجميل. تسوق الآن قبل نفاد الكمية.`
        },
        data: {
          url: `/product/${productId}`,
          type: 'restock'
        },
        tokens
      };

      const response = await admin.messaging().sendEachForMulticast(payload);

      // Cleanup fulfilled restock requests
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      res.status(200).json({ message: "Restock notifications sent", successCount: response.successCount });
    } catch (error: any) {
      console.error("Error sending restock notification:", error);
      res.status(500).json({ error: "فشل إرسال الإشعارات", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, server.cjs is inside dist/
    // So the static files (index.html, assets) are in the same directory (__dirname)
    app.use(express.static(__dirname));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
