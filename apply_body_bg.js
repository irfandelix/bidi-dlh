const fs = require('fs');
let code = fs.readFileSync('src/app/pengawasan/mobile/page.tsx', 'utf-8');
const hookStr = \
  useEffect(() => {
    document.body.style.backgroundColor = '#0f172a'; // slate-900
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.overscrollBehavior = '';
      document.documentElement.style.overscrollBehavior = '';
    };
  }, []);
\;
code = code.replace(/const \[screen, setScreen\] = useState<.*?>\('splash'\);/g, match => match + '\n' + hookStr);
fs.writeFileSync('src/app/pengawasan/mobile/page.tsx', code);
