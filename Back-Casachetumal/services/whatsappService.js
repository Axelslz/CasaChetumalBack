import whatsappWeb from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = whatsappWeb;
import qrcode from 'qrcode-terminal';
import { Op } from 'sequelize';
import Reservation from '../models/Reservation.js';
import dayjs from 'dayjs';

const ADMIN_GROUP_ID = '120363421649556944@g.us';

const BUSINESS_CONFIG = {
    2: {
        name: "Ferre La Bodega",
        welcome: "🛠️ *¡Bienvenido a Ferre La Bodega!* \nTodo para tu construcción.",
        location: "📍 Primera Poniente Sur 556, El Jobo.\n🗺️ Maps: https://maps.app.goo.gl/cjmvACmAjCtdtK2B7",
        menuOptions: "1️⃣ Ubicación 📍\n2️⃣ Ver Catálogo (PDF) 📂\n3️⃣ Hablar con un asesor 👤\n4️⃣ Volver al menú principal 🏠"
    },
    3: {
        name: "Constructora Jaizur",
        welcome: "🏗️ *Constructora Jaizur*\nConstruimos sueños.",
        location: "📍 Chetumal 218, Popular.\n🗺️ Maps: https://maps.app.goo.gl/zocuHurkNWMhgiHCA",
        menuOptions: "1️⃣ Ubicación 📍\n2️⃣ Hablar con un ingeniero 👤\n3️⃣ Volver al menú principal 🏠"
    },
    4: {
        name: "Tracta Transporte",
        welcome: "🚛 *Tracta Transporte*\nSoluciones 24/7.",
        location: "📍 Km 8-5, El Jobo.\n🗺️ Maps: https://maps.app.goo.gl/jiTcPEEA9kkiUmAu6",
        menuOptions: "1️⃣ Ubicación 📍\n2️⃣ Solicitar servicio 👤\n3️⃣ Volver al menú principal 🏠"
    },
    5: {
        name: "Jardín de Sabores",
        welcome: "🥗 *Jardín de Sabores*\nLa mejor experiencia culinaria.",
        location: "📍 Av. 4a. Nte. Pte. 242.\n🗺️ Maps: https://maps.app.goo.gl/tnVy9K1Hue8m8rsj9",
        menuOptions: "1️⃣ Ubicación 📍\n2️⃣ Ver Menú / Asesor 👤\n3️⃣ Volver al menú principal 🏠"
    }
};

const STEPS = {
    MAIN_MENU: 'MAIN_MENU',
    SIMPLE_BUSINESS_MENU: 'SIMPLE_BUSINESS_MENU',
    CASA_MENU: 'CASA_MENU',
    CASA_INFO_DECISION: 'CASA_INFO_DECISION',
    CHECK_DATE: 'CHECK_DATE',
    COLLECT_NAME: 'COLLECT_NAME',
    COLLECT_PEOPLE: 'COLLECT_PEOPLE',
    COLLECT_PHONE: 'COLLECT_PHONE',
    COLLECT_MANTEL: 'COLLECT_MANTEL',
    COLLECT_TIMES: 'COLLECT_TIMES',
    COLLECT_TYPE: 'COLLECT_TYPE',
    VISIT_COLLECT_DAY: 'VISIT_COLLECT_DAY',
    VISIT_COLLECT_TIME: 'VISIT_COLLECT_TIME'
};

const ACTIVATION_KEYWORDS = [
    'hola', 'buenos dias', 'buenos días', 
    'buenas tardes', 'buenas noches', 
    'info', 'informacion', 'precio', 'costo', 
    'ubicacion', 'reservar', 'menu', 'inicio', 'atom'
];

const userSessions = {};

const client = new Client({
    authStrategy: new LocalAuth(), 
    puppeteer: { 
        headless: true, 
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', 
            '--disable-accelerated-2d-canvas', 
            '--no-first-run',
            '--no-zygote',
            '--single-process', 
            '--disable-gpu'   
        ] 
    }
});

const notifyGroup = async (message) => {
    if (!ADMIN_GROUP_ID) return;
    try {
        await client.sendMessage(ADMIN_GROUP_ID, `🔔 *ALERTA ATOM* 🔔\n\n${message}`);
    } catch (error) {
        console.error('Error grupo:', error);
    }
};

client.on('qr', (qr) => {
    console.log('ESCANEA EL QR:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Atom listo.');
});

client.on('message', async (msg) => {

    const chat = await msg.getChat();
    if (chat.isGroup || msg.from === 'status@broadcast') return;

    const messageDate = new Date(msg.timestamp * 1000);
    // Filtro de tiempo (60s)
    if ((new Date() - messageDate) / 1000 > 60) return;

    const sender = msg.from;
    let realPhoneNumber = sender.replace('@c.us', '').replace('@lid', '');
    try {
        const contact = await msg.getContact();
        if (contact) realPhoneNumber = contact.number || contact.id.user || realPhoneNumber;
    } catch (e) {}

    const text = msg.body.trim();
    const textLower = text.toLowerCase();

    if (['cancelar', 'salir', 'adios'].includes(textLower)) {
        delete userSessions[sender];
        await chat.sendMessage('👋 Operación cancelada. Escribe "Hola" cuando nos necesites.');
        return;
    }

    if (!userSessions[sender]) {
        if (ACTIVATION_KEYWORDS.some(k => textLower.includes(k))) {
            userSessions[sender] = { step: STEPS.MAIN_MENU, businessId: null, data: {} };
        } else {
            return; 
        }
    } else {
        if (['volver', 'regresar', 'menu', 'atras'].includes(textLower)) {
            const currentStep = userSessions[sender].step;
            
            if ([STEPS.SIMPLE_BUSINESS_MENU, STEPS.CASA_MENU].includes(currentStep)) {
                userSessions[sender].step = STEPS.MAIN_MENU;
            } else if ([STEPS.CHECK_DATE, STEPS.CASA_INFO_DECISION].includes(currentStep)) {
                userSessions[sender].step = STEPS.CASA_MENU;
            } else if ([STEPS.COLLECT_NAME, STEPS.VISIT_COLLECT_DAY].includes(currentStep)) {
                userSessions[sender].step = STEPS.CASA_MENU;
            } else {
                await chat.sendMessage('⚠️ Regresando al menú principal...');
                userSessions[sender].step = STEPS.MAIN_MENU;
            }
            
            if (userSessions[sender].step === STEPS.MAIN_MENU) {
                 await chat.sendMessage(
                    `🤖 *Menú Principal*\n\n1️⃣ Casa Chetumal\n2️⃣ Ferre La Bodega\n3️⃣ Constructora Jaizur\n4️⃣ Tracta Transporte\n5️⃣ Jardín de Sabores`
                );
                return;
            }
             if (userSessions[sender].step === STEPS.CASA_MENU) {
                 await chat.sendMessage(`🏰 *Casa Chetumal*\n\n1️⃣ Reservar\n2️⃣ Info/Visitas\n3️⃣ Asesor\n4️⃣ Salir`);
                 return;
            }
        }
    }

    const session = userSessions[sender];

    // --- FLUJOS ---
    switch (session.step) {
        
        case STEPS.MAIN_MENU:
            
            if (['1', '2', '3', '4', '5'].includes(text)) {
                if (text === '1') {
                    session.businessId = 1;
                    session.step = STEPS.CASA_MENU;
                    await chat.sendMessage(`🏰 *Casa Chetumal*\n\n1️⃣ Consultar Fecha / Reservar 📅\n2️⃣ Información (PDF) y Visitas ℹ️\n3️⃣ Hablar con asesor 👤\n4️⃣ Menú Principal 🏠`);
                } else {
                    session.businessId = parseInt(text);
                    session.step = STEPS.SIMPLE_BUSINESS_MENU;
                    const config = BUSINESS_CONFIG[session.businessId];
                    await chat.sendMessage(`${config.welcome}\n\n${config.menuOptions}`);
                }
            } else {
                
                await chat.sendMessage(
                    `🤖 *Hola, mi nombre es Atom, soy tu asistente virtual.* \nEs un gusto saludarte. 👋\n\n` +
                   `¿En qué empresa deseas realizar tu consulta hoy?\n\n` +
                    `1️⃣ 🏊 Casa Chetumal (Terraza & Alberca)\n` +
                    `2️⃣ 🛠️ Ferre La Bodega\n` +
                    `3️⃣ 🏗️ Constructora Jaizur\n` +
                    `4️⃣ 🚛 Tracta Transporte y Grúa\n` +
                    `5️⃣ 🥗 Jardín de Sabores\n\n` +
                    `_Escribe el número (1-5)._`
                );
            }
            break;

        case STEPS.SIMPLE_BUSINESS_MENU:
            const config = BUSINESS_CONFIG[session.businessId];
            if (session.businessId === 2) { // Ferre
                if (text === '1') {
                    await chat.sendMessage(config.location);
                    await chat.sendMessage(config.menuOptions);
                } else if (text === '2') {
                    await chat.sendMessage('📂 Un momento, estoy enviando el catálogo...');
                    try {
                        const media = MessageMedia.fromFilePath('./public/catalogo.pdf');
                        await chat.sendMessage(media);
                        await chat.sendMessage('¿Deseas cotizar? Escribe 3.');
                    } catch (e) { await chat.sendMessage('Error PDF. Elige 3.'); }
                } else if (text === '3') {
                    await chat.sendMessage(`👤 Un asesor de *${config.name}* te atenderá.`);
                    notifyGroup(`👤 Cliente solicita ASESOR para *${config.name}*.\n📱 ${realPhoneNumber}`);
                    delete userSessions[sender];
                } else if (text === '4') {
                    session.step = STEPS.MAIN_MENU;
                    await chat.sendMessage('🔙 Regresando...'); 
                    await chat.sendMessage(`🤖 *Menú Principal*\n1️⃣ Casa Chetumal\n2️⃣ Ferre\n3️⃣ Jaizur\n4️⃣ Tracta\n5️⃣ Jardín`);
                } else {
                    await chat.sendMessage('❌ Opción no válida. Intenta 1, 2, 3 o 4.');
                }
            } else { // Otras
                if (text === '1') await chat.sendMessage(config.location);
                else if (text === '2') {
                    await chat.sendMessage(`👤 Un asesor de *${config.name}* te atenderá.`);
                    notifyGroup(`👤 ASESOR para *${config.name}*.\n📱 ${realPhoneNumber}`);
                    delete userSessions[sender];
                } else if (text === '3') {
                    session.step = STEPS.MAIN_MENU;
                    await chat.sendMessage(`🤖 *Menú Principal*\n1️⃣ Casa Chetumal\n2️⃣ Ferre\n3️⃣ Jaizur\n4️⃣ Tracta\n5️⃣ Jardín`);
                } else {
                    await chat.sendMessage('❌ Opción no válida. Intenta 1, 2 o 3.');
                }
            }
            break;

        case STEPS.CASA_MENU:
            if (text === '1') {
                session.step = STEPS.CHECK_DATE;
                await chat.sendMessage('📅 Escribe la fecha: *AAAA-MM-DD* (Ej: 2025-11-20).\n_(O escribe "volver")_');
            } else if (text === '2') {
                await chat.sendMessage('📂 Un momento, Enviando información detallada...');
                try {
                    const media = MessageMedia.fromFilePath('./public/info_casa.pdf');
                    await chat.sendMessage(media);
                } catch (e) {}
                await chat.sendMessage(`¿Qué deseas hacer ahora?\n1️⃣ Iniciar Reservación (Tengo fecha) 📅\n2️⃣ Agendar Visita Previa 👀\n3️⃣ Volver al Menu 🔙`);
                session.step = STEPS.CASA_INFO_DECISION;
            } else if (text === '3') {
                await chat.sendMessage('👤 Un encargado te contactará.');
                notifyGroup(`👤 ASESOR para *Casa Chetumal*.\n📱 ${realPhoneNumber}`);
                delete userSessions[sender];
            } else if (text === '4') {
                session.step = STEPS.MAIN_MENU;
                await chat.sendMessage(`🤖 *Menú Principal*\n1️⃣ Casa Chetumal\n2️⃣ Ferre\n3️⃣ Jaizur\n4️⃣ Tracta\n5️⃣ Jardín`);
            } else {
                await chat.sendMessage('❌ Opción inválida. Elige 1, 2, 3 o 4.');
            }
            break;

        case STEPS.CASA_INFO_DECISION:
            if (text === '1') {
                session.step = STEPS.CHECK_DATE;
                await chat.sendMessage('📅 Escribe fecha evento: *AAAA-MM-DD*.');
            } else if (text === '2') {
                session.step = STEPS.VISIT_COLLECT_DAY;
                await chat.sendMessage('👀 *Agendar Visita*\nRecuerda nuestro horario: Lun - Vie 8am - 5pm. Sabado 9am - 2pm\n\n¿Qué *DÍA* te gustaría visitarnos? (Ej: Este Jueves, 20 de Octubre)');
            } else if (text === '3') {
                session.step = STEPS.CASA_MENU;
                await chat.sendMessage(`🏰 *Casa Chetumal*\n1️⃣ Reservar\n2️⃣ Info/Visitas\n3️⃣ Asesor\n4️⃣ Salir`);
            } else {
                await chat.sendMessage('❌ Elige 1, 2 o 3.');
            }
            break;

        // --- FLUJO VISITA ---
        case STEPS.VISIT_COLLECT_DAY:
            if (text.length < 3) {
                await chat.sendMessage('⚠️ Por favor escribe el día completo (Ej: Lunes 20 de Octubre).');
                return;
            }
            session.data.visitDay = text;
            session.step = STEPS.VISIT_COLLECT_TIME;
            await chat.sendMessage('🕒 ¿A qué *HORA*? (Horario:  Lun - Vie 8am - 5pm. Sabado 9am - 2pm)');
            break;

        case STEPS.VISIT_COLLECT_TIME:
            session.data.visitTime = text;
            await chat.sendMessage(`✅ ¡Visita Agendada!\n🗓️ ${session.data.visitDay} - ${session.data.visitTime}\n¡Te esperamos!`);
            notifyGroup(`👀 *VISITA AGENDADA*\n🗓️ ${session.data.visitDay}\n⏰ ${session.data.visitTime}\n📱 ${realPhoneNumber}`);
            delete userSessions[sender];
            break;

        // --- FLUJO RESERVA ---
        case STEPS.CHECK_DATE:
            if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
                await chat.sendMessage('⚠️ Formato incorrecto. Debe ser AAAA-MM-DD (Ej: 2025-12-31).\nIntenta de nuevo o escribe "volver".');
                return;
            }
            const date = dayjs(text);
            if (!date.isValid()) {
                await chat.sendMessage('⚠️ Fecha no válida en el calendario.');
                return;
            }
            if (date.isBefore(dayjs(), 'day')) {
                await chat.sendMessage('⚠️ No puedes reservar fechas pasadas.');
                return;
            }

            const existingRes = await Reservation.findOne({ where: { eventDate: text, status: { [Op.ne]: 'cancelled' } } });
            
            if (!existingRes) {
                session.data.eventDate = text;
                session.step = STEPS.COLLECT_NAME;
                await chat.sendMessage(`✅ Disponible. 1️⃣ Escribe tu *Nombre Completo*.`);
            } else {
                await chat.sendMessage(`❌ Fecha ocupada. Por favor escribe otra fecha (AAAA-MM-DD).`);
            }
            break;

        case STEPS.COLLECT_NAME:
            if (text.length < 3) {
                await chat.sendMessage('⚠️ El nombre es muy corto. Escribe tu nombre completo.');
                return;
            }
            session.data.clientName = text;
            session.step = STEPS.COLLECT_PEOPLE;
            await chat.sendMessage('2️⃣ *Cantidad de personas*? (Escribe solo el número, Máx 60)');
            break;

        case STEPS.COLLECT_PEOPLE:
            if (isNaN(text) || parseInt(text) > 60 || parseInt(text) < 1) {
                await chat.sendMessage('⚠️ Cantidad inválida. Debe ser un número entre 1 y 60.');
                return;
            }
            session.data.peopleCount = text;
            session.step = STEPS.COLLECT_PHONE;
            await chat.sendMessage('3️⃣ *Número de teléfono* de contacto.');
            break;

        case STEPS.COLLECT_PHONE:
            if (text.length < 10) {
                await chat.sendMessage('⚠️ Número muy corto. Verifica que sea a 10 dígitos.');
                return;
            }
            session.data.clientPhone = text;
            session.step = STEPS.COLLECT_MANTEL;
            await chat.sendMessage('4️⃣ *Color de mantel*:\n(Opciones: Dorado, Rosa, Plata, Gris, Rojo)');
            break;

        case STEPS.COLLECT_MANTEL:
            const colors = ['dorado', 'rosa', 'plata', 'gris', 'rojo'];
            if (!colors.includes(text.toLowerCase())) {
                await chat.sendMessage('⚠️ Color no disponible. Por favor elige: Dorado, Rosa, Plata, Gris o Rojo.');
                return;
            }
            session.data.tableclothColor = text;
            session.step = STEPS.COLLECT_TIMES;
            await chat.sendMessage('5️⃣ *Hora entrada y salida*? (Ej: 12pm a 6pm)');
            break;

        case STEPS.COLLECT_TIMES:
            session.data.eventTimeRange = text;
            session.step = STEPS.COLLECT_TYPE;
            await chat.sendMessage('6️⃣ *Tipo de evento*? (Ej: Boda, Cumpleaños)');
            break;

        case STEPS.COLLECT_TYPE:
            session.data.eventType = text;
            try {
                const notes = `Mantel: ${session.data.tableclothColor}\nHorario: ${session.data.eventTimeRange}\nTipo: ${session.data.eventType}\nPersonas: ${session.data.peopleCount}`;
                await Reservation.create({
                    clientName: session.data.clientName,
                    clientPhone: session.data.clientPhone,
                    eventDate: session.data.eventDate,
                    eventTime: '12:00:00',
                    totalPrice: 3250, 
                    paymentMethod: 'cash',
                    status: 'pending',
                    musicNotes: notes
                });
                await chat.sendMessage(`🎉 *¡Pre-reserva lista!* Fecha: ${session.data.eventDate}.\n⚠️ Falta anticipo. Visítanos de 8am a 5pm.`);
                
                notifyGroup(
                    `📅 *RESERVA ATOM*\n` +
                    `👤 ${session.data.clientName}\n` +
                    `📆 ${session.data.eventDate}\n` +
                    `📱 ${realPhoneNumber}`
                );
                // ----------------------------------------------------

            } catch (error) {
                console.error(error);
                await chat.sendMessage('Error al guardar. Contacta a un humano.');
            }
            delete userSessions[sender];
            break;

        default:
            delete userSessions[sender];
            await chat.sendMessage('Error. Escribe "Hola".');
            break;
    }
});

export const startWhatsappBot = () => {
    client.initialize();
};