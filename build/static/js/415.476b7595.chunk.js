"use strict";(self.webpackChunkfuse_react_app=self.webpackChunkfuse_react_app||[]).push([[415],{415:function(e,s,a){a.r(s);var l=a(1413),t=a(1432),r=a(75627),i=a(24193),n=a(44758),o=a(1550),c=a(83929),d=a(24631),m=a(61113),x=a(29466),u=a(6473),h=a(58970),f=a(56993),j=a(76017),p=a(63585),g=a(9506),v=a(82295),w=a(47313),b=a(97801),y=a(46417),Z=u.Ry().shape({email:u.Z_().email("You must enter a valid email").required("You must enter a email"),password:u.Z_().required("Please enter your password.").min(4,"Password is too short - must be at least 4 chars.")}),N={email:"",password:"",remember:!0};s.default=function(){var e=(0,r.cI)({mode:"onChange",defaultValues:N,resolver:(0,t.X)(Z)}),s=e.control,a=e.formState,u=e.handleSubmit,k=e.setError,S=e.setValue,W=a.isValid,z=a.dirtyFields,C=a.errors;return(0,w.useEffect)((function(){S("email","admin@fusetheme.com",{shouldDirty:!0,shouldValidate:!0}),S("password","admin",{shouldDirty:!0,shouldValidate:!0})}),[S]),(0,y.jsxs)("div",{className:"flex flex-col sm:flex-row items-center md:items-start sm:justify-center md:justify-start flex-1 min-w-0",children:[(0,y.jsx)(v.Z,{className:"h-full sm:h-auto md:flex md:items-center md:justify-end w-full sm:w-auto md:h-full md:w-1/2 py-8 px-16 sm:p-48 md:p-64 sm:rounded-2xl md:rounded-none sm:shadow md:shadow-none ltr:border-r-1 rtl:border-l-1",children:(0,y.jsxs)("div",{className:"w-full max-w-320 sm:w-320 mx-auto sm:mx-0",children:[(0,y.jsx)("img",{className:"w-48",src:"assets/images/logo/logo.svg",alt:"logo"}),(0,y.jsx)(m.Z,{className:"mt-32 text-4xl font-extrabold tracking-tight leading-tight",children:"Sign in"}),(0,y.jsxs)("div",{className:"flex items-baseline mt-2 font-medium",children:[(0,y.jsx)(m.Z,{children:"Don't have an account?"}),(0,y.jsx)(x.rU,{className:"ml-4",to:"/sign-up",children:"Sign up"})]}),(0,y.jsxs)("div",{className:"flex items-baseline mt-2 font-medium",children:[(0,y.jsx)(m.Z,{children:"Welcome Page"}),(0,y.jsx)(x.rU,{className:"ml-4",to:"/welcome",children:"Welcome"})]}),(0,y.jsxs)("div",{className:"flex items-baseline mt-2 font-medium",children:[(0,y.jsx)(m.Z,{children:"Welcome Page"}),(0,y.jsx)(x.rU,{className:"ml-4",to:"/registration/capnet",children:"Registration"})]}),(0,y.jsxs)("form",{name:"loginForm",noValidate:!0,className:"flex flex-col justify-center w-full mt-32",onSubmit:u((function(e){var s=e.email,a=e.password;b.Z.signInWithEmailAndPassword(s,a).then((function(e){})).catch((function(e){e.forEach((function(e){k(e.type,{type:"manual",message:e.message})}))}))})),children:[(0,y.jsx)(r.Qr,{name:"email",control:s,render:function(e){var s,a=e.field;return(0,y.jsx)(d.Z,(0,l.Z)((0,l.Z)({},a),{},{className:"mb-24",label:"Email",autoFocus:!0,type:"email",error:!!C.email,helperText:null===C||void 0===C||null===(s=C.email)||void 0===s?void 0:s.message,variant:"outlined",required:!0,fullWidth:!0}))}}),(0,y.jsx)(r.Qr,{name:"password",control:s,render:function(e){var s,a=e.field;return(0,y.jsx)(d.Z,(0,l.Z)((0,l.Z)({},a),{},{className:"mb-24",label:"Password",type:"password",error:!!C.password,helperText:null===C||void 0===C||null===(s=C.password)||void 0===s?void 0:s.message,variant:"outlined",required:!0,fullWidth:!0}))}}),(0,y.jsxs)("div",{className:"flex flex-col sm:flex-row items-center justify-center sm:justify-between",children:[(0,y.jsx)(r.Qr,{name:"remember",control:s,render:function(e){var s=e.field;return(0,y.jsx)(o.Z,{children:(0,y.jsx)(c.Z,{label:"Remember me",control:(0,y.jsx)(n.Z,(0,l.Z)({size:"small"},s))})})}}),(0,y.jsx)(x.rU,{className:"text-md font-medium",to:"/pages/auth/forgot-password",children:"Forgot password?"})]}),(0,y.jsx)(i.Z,{variant:"contained",color:"primary",className:" w-full mt-16","aria-label":"Sign in",disabled:h.Z.isEmpty(z)||!W,type:"submit",size:"large",children:"Sign in"}),(0,y.jsxs)("div",{className:"flex items-center mt-32",children:[(0,y.jsx)("div",{className:"flex-auto mt-px border-t"}),(0,y.jsx)(m.Z,{className:"mx-8",color:"text.secondary",children:"Or continue with"}),(0,y.jsx)("div",{className:"flex-auto mt-px border-t"})]}),(0,y.jsxs)("div",{className:"flex items-center mt-32 space-x-16",children:[(0,y.jsx)(i.Z,{variant:"outlined",className:"flex-auto",children:(0,y.jsx)(f.Z,{size:20,color:"action",children:"feather:facebook"})}),(0,y.jsx)(i.Z,{variant:"outlined",className:"flex-auto",children:(0,y.jsx)(f.Z,{size:20,color:"action",children:"feather:twitter"})}),(0,y.jsx)(i.Z,{variant:"outlined",className:"flex-auto",children:(0,y.jsx)(f.Z,{size:20,color:"action",children:"feather:github"})})]})]})]})}),(0,y.jsxs)(g.Z,{className:"relative hidden md:flex flex-auto items-center justify-center h-full p-64 lg:px-112 overflow-hidden",sx:{backgroundColor:"primary.main"},children:[(0,y.jsx)("svg",{className:"absolute inset-0 pointer-events-none",viewBox:"0 0 960 540",width:"100%",height:"100%",preserveAspectRatio:"xMidYMax slice",xmlns:"http://www.w3.org/2000/svg",children:(0,y.jsxs)(g.Z,{component:"g",sx:{color:"primary.light"},className:"opacity-20",fill:"none",stroke:"currentColor",strokeWidth:"100",children:[(0,y.jsx)("circle",{r:"234",cx:"196",cy:"23"}),(0,y.jsx)("circle",{r:"234",cx:"790",cy:"491"})]})}),(0,y.jsxs)(g.Z,{component:"svg",className:"absolute -top-64 -right-64 opacity-20",sx:{color:"primary.light"},viewBox:"0 0 220 192",width:"220px",height:"192px",fill:"none",children:[(0,y.jsx)("defs",{children:(0,y.jsx)("pattern",{id:"837c3e70-6c3a-44e6-8854-cc48c737b659",x:"0",y:"0",width:"20",height:"20",patternUnits:"userSpaceOnUse",children:(0,y.jsx)("rect",{x:"0",y:"0",width:"4",height:"4",fill:"currentColor"})})}),(0,y.jsx)("rect",{width:"220",height:"192",fill:"url(#837c3e70-6c3a-44e6-8854-cc48c737b659)"})]}),(0,y.jsxs)("div",{className:"z-10 relative w-full max-w-2xl",children:[(0,y.jsxs)("div",{className:"text-7xl font-bold leading-none text-gray-100",children:[(0,y.jsx)("div",{children:"Welcome to"}),(0,y.jsx)("div",{children:"our community"})]}),(0,y.jsx)("div",{className:"mt-24 text-lg tracking-tight leading-6 text-gray-400",children:"Fuse helps developers to build organized and well coded dashboards full of beautiful and rich modules. Join us and start building your application today."}),(0,y.jsxs)("div",{className:"flex items-center mt-32",children:[(0,y.jsxs)(j.Z,{sx:{"& .MuiAvatar-root":{borderColor:"primary.main"}},children:[(0,y.jsx)(p.Z,{src:"assets/images/avatars/female-18.jpg"}),(0,y.jsx)(p.Z,{src:"assets/images/avatars/female-11.jpg"}),(0,y.jsx)(p.Z,{src:"assets/images/avatars/male-09.jpg"}),(0,y.jsx)(p.Z,{src:"assets/images/avatars/male-16.jpg"})]}),(0,y.jsx)("div",{className:"ml-16 font-medium tracking-tight text-gray-400",children:"More than 17k people joined us, it's your turn"})]})]})]})]})}}}]);