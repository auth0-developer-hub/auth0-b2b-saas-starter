import { Theme } from "@stigg/react-sdk"

// language=CSS
const customCss = `
    * {
        font-family: var(--font-inter-sans), sans-serif !important;
    }
    
    .stigg-paywall-plans-layout  {
        flex-wrap: wrap !important;
    }
    
    .stigg-plan-offering-container {
        max-width: none;
        min-width: 284px;
        width: 284px;
    }
    
    .stigg-plan-offering-container:first-of-type{
        margin-left: initial !important;
    }
    
    .stigg-plan-offering-container:last-child {
        margin-right: initial !important;
        width: 100%;
    }
    
    .stigg-customer-portal-sections > div {
        padding: 24px;
    }
    
    .MuiTabs-indicator {
        background-color: #FAFAFA !important;
    }
    
    .stigg-plan-description {
        font-size: 14px;
    }
    
    .stigg-price-tier-select {
        display: none;
    }
    
    .stigg-paywall-plan-button:hover {
        /*background-color: rgba(250, 250, 250, 0.04);*/
    }
    
    .stigg-paywall-plan-button-text {
        color: #171717;
    }
    
    .stigg-manage-subscription-button {
        display: none;
    }
    
    .stigg-skeleton-loader-billing-period {
      background-color: #0E0E10;
      display: none;
    }
    
    .stigg-skeleton-loader-plans-container > div {
      max-width: 284px;
      min-width: 284px;
    }
    
    .stigg-skeleton-loader-plans-container > div > div {
      display: none;
    }
    
    .stigg-checkout-layout div[class*="-SummaryCard"] {     
        border: 1px solid #303036; 
        background: #0e0e10; 
    }
    
    .stigg-checkout-layout div[class*="-SummaryCard"] svg g {
        stroke: #FAFAFA;
    }
    
    .stigg-checkout-change-plan-button-text {
        font-size: 14px;
    }
    
    .stigg-checkout-summary-cta-button {
        background-color: #FAFAFA;
        
    }
    
    .stigg-checkout-summary-cta-button-text{
        color: #171717;
    }
    
    .stigg-checkout-summary-cta-button > p {
        font-size: 16px;
    }
    
    .stigg-current-plan .stigg-entitlement-row-icon path {
        fill: #FAFAFA;
    }
    
    .stigg-checkout-downgrade-to-free-alert {
        background-color: #0E0E10;
    }
  `

export const providerTheme: Theme = {
  typography: {
    h1: {
      fontSize: "30px",
    },
    h2: {
      fontSize: "24px",
    },
    h3: {
      fontSize: "16px",
    },
    body: {
      fontSize: "14px",
    },
  },
  palette: {
    primary: "#FAFAFA",
    outlinedHoverBackground: "#fafafae6",
    backgroundHighlight: "#303036",
    backgroundButton: "#FAFAFA",
    white: "#171717", // dark theme
    text: {
      primary: "#FAFAFA",
    },
    backgroundSection: "#0E0E10",
    outlinedRestingBorder: "#303036",
    backgroundPaper: "#0E0E10",
    outlinedBorder: "#303036",
    switchBorder: "#303036",
    switchFill: "#303036",
  },
  customCss: customCss,
}
