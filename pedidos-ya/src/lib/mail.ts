import nodemailer from 'nodemailer'

const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER || 'reclutamiento@enigmasecurity.cl',
        pass: (process.env.SMTP_PASS || '#F5gLJ0pWC[c32').replace(/^"|"$/g, ''),
    },
}

const transporter = nodemailer.createTransport(smtpConfig)

export async function sendStatusEmail(application: any) {
    const { email, firstName, status, trackingCode, rejectionReason } = application

    let subject = ''
    let title = ''
    let content = ''
    let color = '#3B82F6' // Blue for general info

    if (status === 'IN_REVIEW') {
        subject = 'Solicitud en Revisión - PideloYA'
        title = '¡Tu solicitud está en camino!'
        color = '#F59E0B' // Amber
        content = `
            <p>Hola <strong>${firstName}</strong>,</p>
            <p>Hemos recibido tu solicitud para ser Driver de PideloYA. En este momento nuestro equipo está verificando tus documentos.</p>
            <p>Este proceso toma normalmente entre <strong>24 y 48 horas hábiles</strong>.</p>
            <p>Tu código de seguimiento es: <strong>${trackingCode}</strong></p>
        `
    } else if (status === 'APPROVED') {
        subject = '¡Felicidades! Solicitud Aprobada - PideloYA'
        title = '¡Bienvenido a la familia PideloYA!'
        color = '#10B981' // Green
        content = `
            <p>Hola <strong>${firstName}</strong>,</p>
            <p>Tenemos excelentes noticias: <strong>¡Tu solicitud ha sido aprobada!</strong> Ya eres parte de nuestro equipo de drivers.</p>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h3 style="color: #065F46; margin-top: 0;">🚀 Pasos para empezar:</h3>
                <ol style="color: #065F46; padding-left: 20px;">
                    <li><strong>Descarga la App:</strong> <a href="https://expo.dev/artifacts/eas/..." style="color: #059669; font-weight: bold;">Click aquí para descargar Driver App</a></li>
                    <li><strong>Inicia Sesión:</strong> Usa el RUT y la contraseña que creaste durante el registro.</li>
                    <li><strong>Sube tu Equipo:</strong> Asegúrate de tener tu mochila térmica y celular con carga.</li>
                    <li><strong>¡Conéctate!:</strong> Una vez dentro, toca en "Conectarme" para empezar a recibir pedidos.</li>
                </ol>
            </div>

            <h3 style="color: #333;">📖 Guía rápida del Driver:</h3>
            <ul style="color: #555; padding-left: 20px;">
                <li><strong>Aceptación:</strong> Tienes 30 segundos para aceptar un pedido cuando aparezca en pantalla.</li>
                <li><strong>Recogida:</strong> Sigue la ruta de Google Maps hasta el local y muestra tu número de pedido.</li>
                <li><strong>Entrega:</strong> Verifica siempre el nombre del cliente y entrega con una sonrisa.</li>
            </ul>
        `
    } else if (status === 'REJECTED') {
        subject = 'Actualización sobre tu solicitud - PideloYA'
        title = 'Información sobre tu solicitud'
        color = '#EF4444' // Red
        content = `
            <p>Hola <strong>${firstName}</strong>,</p>
            <p>Lamentamos informarte que tu solicitud no ha podido ser aprobada en esta ocasión.</p>
            <div style="background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="color: #991B1B; margin: 0;"><strong>Motivo:</strong> ${rejectionReason || 'Documentación incompleta o no cumple con los requisitos mínimos.'}</p>
            </div>
            <p>Puedes intentar postular nuevamente en 30 días asegurándote de corregir los puntos mencionados.</p>
        `
    }

    if (!subject) return;

    try {
        await transporter.sendMail({
            from: `"PideloYA" <${smtpConfig.auth.user}>`,
            to: email,
            subject: subject,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 12px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: ${color}; margin: 0;">PideloYA</h1>
                    </div>
                    <h2 style="color: #333; text-align: center;">${title}</h2>
                    <div style="line-height: 1.6; font-size: 15px; color: #444;">
                        ${content}
                    </div>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="font-size: 13px; color: #999; text-align: center;">
                        Este es un correo automático, por favor no respondas a este mensaje.<br>
                        © 2026 PideloYA Chile.
                    </p>
                </div>
            `
        })
        console.log(`[EMAIL STATUS] Mensaje enviado a ${email} - Estado: ${status}`)
    } catch (err) {
        console.error('[EMAIL STATUS ERROR]', err)
    }
}
