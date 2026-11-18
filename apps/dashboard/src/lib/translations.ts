export type Language = 'my' | 'en';

export const translations = {
  my: {
    brandSubtitle: 'ချိတ်ချက် Omnichannel',
    navInbox: 'စုပေါင်း inbox',
    navCustomers: 'ဝယ်သူမှတ်တမ်း (CRM)',
    navChannels: 'ချန်နယ်များ (FB/Viber/TG)',
    navAi: 'Gemini AI အရောင်းစက်',
    navSettings: 'ဆက်တင်များ',

    // Quota widget
    planTitle: 'အစီအစဉ်',
    activeBadge: 'သက်တမ်းရှိ',
    connectedChannels: 'ချိတ်ဆက်ချန်နယ်',
    perMonth: 'MMK / လ',

    // Inbox triage
    messagesHeader: 'မက်ဆေ့ခ်ျများ',
    searchPlaceholder: 'အမည်၊ ဖုန်းနံပါတ်ဖြင့် ရှာဖွေပါ...',
    tabAll: 'အားလုံး',
    tabUnassigned: 'မခွဲရသေး',
    tabMine: 'ကျွန်ုပ်',
    tabResolved: 'ပြီးစီး',
    emptyMessages: 'မက်ဆေ့ခ်ျများ မရှိသေးပါ',
    guestCustomer: 'ဧည့်သည်ဝယ်သူ',
    botHandling: 'AI လက်ထောက်',
    agentHandling: 'အေးဂျင့်ကိုင်တွယ်',

    // Chat Area
    assignToMe: 'ကိုယ်တိုင်လက်ခံပြောကြားမည်',
    assignedTo: 'မှ တာဝန်ယူထားသည်',
    resolve: 'ပြီးစီး',
    noChatSelected: 'စကားပြောဆိုမှု မရွေးချယ်ရသေးပါ',
    noChatSelectedDesc: 'ဘယ်ဘက်စာရင်းမှ စကားစမြည်တစ်ခုကို ရွေးချယ်ပြီး ဝယ်သူနှင့် စကားစတင်ပြောကြားနိုင်ပါသည်',
    replyToCustomer: 'ဝယ်သူထံသို့ စာပြန်ရန်',
    internalNote: 'အတွင်းသီးသန့်မှတ်ချက်',
    shortcuts: 'ဖြတ်လမ်းများ ( / )',
    inputPlaceholder: 'မက်ဆေ့ခ်ျ ရေးသားပါ (မြန်မာ/English)... Canned responses အတွက် / ရိုက်ပါ',
    internalNotePlaceholder: 'အတွင်းမှတ်ချက် ရေးသားပါ (အခြားအေးဂျင့်များသာ မြင်နိုင်ပါသည်)...',
    delivered: 'ပေးပို့ပြီး',
    internalNoteBadge: 'အတွင်းသီးသန့်မှတ်ချက် (ဝယ်သူ မမြင်နိုင်ပါ)',

    // CRM Profile
    contactInfo: 'ဆက်သွယ်ရန် အချက်အလက်',
    phoneLabel: 'ဖုန်းနံပါတ်',
    noPhone: 'ဖုန်းနံပါတ် မရှိပါ',
    deliAddress: 'ပို့ဆောင်မည့် လိပ်စာ',
    noAddress: 'ပို့ဆောင်မည့် လိပ်စာ မဖြည့်ရသေးပါ',
    socialAccounts: 'ပေါင်းစည်းထားသော လူမှုကွန်ရက်များ',
    orderHistory: 'ဝယ်ယူမှု မှတ်တမ်း',
    totalOrders: 'စုစုပေါင်း အော်ဒါ',
    totalSpent: 'စုစုပေါင်း သုံးစွဲငွေ',
    tagsLabel: 'တဂ်များ (Tags)',

    // Language Toggle
    langMyanmar: 'မြန်မာ',
    langEnglish: 'English',
  },
  en: {
    brandSubtitle: 'Omnichannel Support',
    navInbox: 'Unified Inbox',
    navCustomers: 'Customer CRM',
    navChannels: 'Channels (FB/Viber/TG)',
    navAi: 'Gemini AI Sales Bot',
    navSettings: 'Settings',

    // Quota widget
    planTitle: 'Subscription',
    activeBadge: 'Active',
    connectedChannels: 'Connected Channels',
    perMonth: 'MMK / mo',

    // Inbox triage
    messagesHeader: 'Conversations',
    searchPlaceholder: 'Search by name, phone...',
    tabAll: 'All',
    tabUnassigned: 'Unassigned',
    tabMine: 'Mine',
    tabResolved: 'Resolved',
    emptyMessages: 'No conversations found',
    guestCustomer: 'Guest Customer',
    botHandling: 'AI Assistant',
    agentHandling: 'Agent Assigned',

    // Chat Area
    assignToMe: 'Assign to Me',
    assignedTo: 'Assigned to',
    resolve: 'Resolve',
    noChatSelected: 'No conversation selected',
    noChatSelectedDesc: 'Select a conversation from the left to start chatting with your customer',
    replyToCustomer: 'Reply to Customer',
    internalNote: 'Private Note',
    shortcuts: 'Shortcuts ( / )',
    inputPlaceholder: 'Type a message... Type / for canned templates',
    internalNotePlaceholder: 'Write private note (only visible to team agents)...',
    delivered: 'Delivered',
    internalNoteBadge: 'Internal Note (Hidden from customer)',

    // CRM Profile
    contactInfo: 'Contact Information',
    phoneLabel: 'Phone',
    noPhone: 'No phone recorded',
    deliAddress: 'Delivery Address',
    noAddress: 'No address provided',
    socialAccounts: 'Connected Social Accounts',
    orderHistory: 'Purchase History',
    totalOrders: 'Total Orders',
    totalSpent: 'Total Spent',
    tagsLabel: 'Tags',

    // Language Toggle
    langMyanmar: 'မြန်မာ',
    langEnglish: 'English',
  },
};
