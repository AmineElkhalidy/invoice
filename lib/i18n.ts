export type Locale = "fr" | "ar";

export const translations = {
  fr: {
    // Auth
    loginTitle: "Connexion",
    username: "Nom d'utilisateur",
    password: "Mot de passe",
    loginButton: "Se connecter",
    loginError: "Identifiants incorrects",
    logout: "Déconnexion",

    // Header
    appTitle: "Gestion de Facturation",
    switchLang: "الدارجة",

    // Dashboard
    dashboardTitle: "Nouvelle Facture",
    customerName: "Nom du client",
    customerNamePlaceholder: "Entrez le nom du client",
    clientIce: "ICE du client",
    clientIcePlaceholder: "Entrez l'ICE du client",
    unitPriceInput: "Prix Unitaire (MAD)",
    unitPricePlaceholder: "0.00",
    quantityInput: "Quantité (Litres)",
    quantityPlaceholder: "0.00",
    fuelType: "Type de carburant",
    gasoil: "Gasoil",
    unleaded: "SSP",
    generateInvoice: "Créer la facture",
    resetForm: "Réinitialiser",

    // Invoice
    invoiceTitle: "FACTURE",
    invoiceNumber: "Facture N°",
    date: "Date",
    ice: "ICE",
    rc: "RC",
    identifiantFiscal: "IF",
    patente: "Patente",
    phone: "Tél",
    clientLabel: "Client",
    descriptionLabel: "Désignation",
    quantityLabel: "Qté",
    unitPriceLabel: "P.U (MAD)",
    totalLabel: "Total (MAD)",
    fuelPurchase: "Achat carburant",
    totalHT: "Total HT",
    tva: "TVA (10%)",
    totalTTC: "Total TTC",
    amountInWords: "Arrêté la présente facture à la somme de",
    mad: "MAD",
    signature: "Signature & Cachet",
    printInvoice: "Imprimer / Sauvegarder PDF",
    newInvoice: "Nouvelle facture",
    thankYou: "Merci pour votre confiance",

    // Clients
    manageClients: "Gérer les clients",
    clientsTitle: "Clients",
    addClient: "Ajouter un client",
    updateClient: "Modifier le client",
    cancel: "Annuler",
    noClientsFound: "Aucun client trouvé. Ajoutez-en un ci-dessus.",
    actions: "Actions",
    edit: "Modifier",
    delete: "Supprimer",
    confirmDelete: "Êtes-vous sûr de vouloir supprimer ce client ?",
    loadingClients: "Chargement des clients...",

    // User Management
    manageUsers: "Gérer les utilisateurs",
    usersTitle: "Utilisateurs",
    addUser: "Ajouter un utilisateur",
    updateUser: "Modifier l'utilisateur",
    deleteUser: "Supprimer l'utilisateur",
    usernamePlaceholder: "Entrez le nom d'utilisateur",
    displayNameLabel: "Nom complet",
    displayNamePlaceholder: "Entrez le nom complet",
    roleLabel: "Rôle",
    roleAdmin: "Administrateur",
    roleUser: "Utilisateur",
    noUsersFound: "Aucun utilisateur trouvé.",
    confirmDeleteUser: "Êtes-vous sûr de vouloir supprimer cet utilisateur ?",
    usernameExists: "Ce nom d'utilisateur existe déjà.",
    passwordPlaceholder: "Entrez le mot de passe",

    // Password Change
    changePassword: "Changer le mot de passe",
    currentPassword: "Mot de passe actuel",
    newPassword: "Nouveau mot de passe",
    confirmNewPassword: "Confirmer le nouveau mot de passe",
    passwordChanged: "Mot de passe changé avec succès !",
    passwordMismatch: "Les mots de passe ne correspondent pas.",
    wrongCurrentPassword: "Mot de passe actuel incorrect.",

    // Invoice History
    invoiceHistory: "Historique des factures",
    allInvoices: "Toutes les factures",
    filterByClient: "Filtrer par client",
    noInvoicesFound: "Aucune facture trouvée.",
    createdBy: "Créé par",
    totalInvoices: "Total factures",
    searchInvoices: "Rechercher une facture...",

    // Settings / Admin
    settings: "Paramètres",
    adminPanel: "Panneau admin",
    loggedInAs: "Connecté en tant que",
  },
  ar: {
    // Auth
    loginTitle: "الدخول",
    username: "الإسم",
    password: "كلمة السر",
    loginButton: "دخول",
    loginError: "المعلومات غالطة",
    logout: "خروج",

    // Header
    appTitle: "تسيير الفواتر",
    switchLang: "Français",

    // Dashboard
    dashboardTitle: "فاتورة جديدة",
    customerName: "سمية الكليان",
    customerNamePlaceholder: "دخل سمية الكليان",
    clientIce: "ICE ديال الكليان",
    clientIcePlaceholder: "دخل ICE ديال الكليان",
    unitPriceInput: "ثمن الوحدة (درهم)",
    unitPricePlaceholder: "0.00",
    quantityInput: "الكمية (لتر)",
    quantityPlaceholder: "0.00",
    fuelType: "نوع الكاربيران",
    gasoil: "ﯕازوال",
    unleaded: "ايصانص",
    generateInvoice: "صاوب الفاتورة",
    resetForm: "مسح",

    // Invoice
    invoiceTitle: "فاتورة",
    invoiceNumber: "فاتورة رقم",
    date: "التاريخ",
    ice: "ICE",
    rc: "RC",
    identifiantFiscal: "IF",
    patente: "Patente",
    phone: "تيليفون",
    clientLabel: "الكليان",
    descriptionLabel: "التسمية",
    quantityLabel: "الكمية",
    unitPriceLabel: "ثمن الوحدة",
    totalLabel: "المجموع (درهم)",
    fuelPurchase: "شرا ديال الكاربيران",
    totalHT: "المجموع بلا TVA",
    tva: "TVA (10%)",
    totalTTC: "المجموع الكلي",
    amountInWords: "المبلغ الإجمالي ديال هاد الفاتورة هو",
    mad: "درهم",
    signature: "التوقيع والطابع",
    printInvoice: "طبع / حفظ PDF",
    newInvoice: "فاتورة جديدة",
    thankYou: "شكرا على الثيقة ديالكم",

    // Clients
    manageClients: "تسيير الكليان",
    clientsTitle: "الكليان",
    addClient: "زيد كليان",
    updateClient: "بدل الكليان",
    cancel: "إلغاء",
    noClientsFound: "مكاين حتى كليان. زيد واحد الفوق.",
    actions: "شنو دير",
    edit: "بدل",
    delete: "مسح",
    confirmDelete: "واش متأكد بغيتي تمسح هاد الكليان؟",
    loadingClients: "كنجيبو الكليان...",

    // User Management
    manageUsers: "تسيير المستخدمين",
    usersTitle: "المستخدمين",
    addUser: "زيد مستخدم",
    updateUser: "بدل المستخدم",
    deleteUser: "مسح المستخدم",
    usernamePlaceholder: "دخل إسم المستخدم",
    displayNameLabel: "الإسم الكامل",
    displayNamePlaceholder: "دخل الإسم الكامل",
    roleLabel: "الدور",
    roleAdmin: "مدير",
    roleUser: "مستخدم",
    noUsersFound: "مكاين حتى مستخدم.",
    confirmDeleteUser: "واش متأكد بغيتي تمسح هاد المستخدم؟",
    usernameExists: "هاد إسم المستخدم كاين من قبل.",
    passwordPlaceholder: "دخل كلمة السر",

    // Password Change
    changePassword: "بدل كلمة السر",
    currentPassword: "كلمة السر الحالية",
    newPassword: "كلمة السر الجديدة",
    confirmNewPassword: "أكد كلمة السر الجديدة",
    passwordChanged: "كلمة السر تبدلات بنجاح!",
    passwordMismatch: "كلمات السر ما متطابقاش.",
    wrongCurrentPassword: "كلمة السر الحالية غالطة.",

    // Invoice History
    invoiceHistory: "تاريخ الفواتر",
    allInvoices: "جميع الفواتر",
    filterByClient: "فلتر بالكليان",
    noInvoicesFound: "مكاين حتى فاتورة.",
    createdBy: "صاوبها",
    totalInvoices: "مجموع الفواتر",
    searchInvoices: "قلب على فاتورة...",

    // Settings / Admin
    settings: "إعدادات",
    adminPanel: "لوحة المدير",
    loggedInAs: "داخل ب",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["fr"];

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale][key];
}
