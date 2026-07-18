const fs = require('fs');

let code = fs.readFileSync('../bidi-dlh-mobile/src/FormBAP.tsx', 'utf-8');

// 1. Remove RN imports
code = code.replace(/import \{ View.*?from 'react-native';/, '');
code = code.replace(/import tw from 'twrnc';/, '');
code = code.replace(/import \* as ImagePicker.*?from 'expo-image-picker';/, '');
code = code.replace(/import \* as Location.*?from 'expo-location';/, '');
code = code.replace(/import SignatureScreen.*?from 'react-native-signature-canvas';/, '');
code = code.replace(/import AsyncStorage.*?from '@react-native-async-storage\/async-storage';/, '');

// 2. Element replacements
code = code.replace(/<View/g, '<div');
code = code.replace(/<\/View>/g, '</div>');
code = code.replace(/<Text/g, '<span');
code = code.replace(/<\/Text>/g, '</span>');
code = code.replace(/<ScrollView.*?showsVerticalScrollIndicator=\{false\}>/g, '<div className="flex-1 overflow-y-auto">');
code = code.replace(/<\/ScrollView>/g, '</div>');
code = code.replace(/<TouchableOpacity/g, '<button');
code = code.replace(/<\/TouchableOpacity>/g, '</button>');
code = code.replace(/<Image source=\{\{ uri: (.*?) \}\} /g, '<img src={$1} ');
code = code.replace(/<ActivityIndicator color="([^"]+)" \/>/g, '<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>');

// 3. TextInput replacements
code = code.replace(/<TextInput/g, '<input');
// Convert onChangeText={...} to onChange={(e) => { ... e.target.value }}
code = code.replace(/onChangeText=\{\(v\)\s*=>\s*(.*?)\}/g, 'onChange={(e) => { const v = e.target.value; $1 }}');
code = code.replace(/onChangeText=\{v\s*=>\s*\{(.*?)\}\}/g, 'onChange={(e) => { const v = e.target.value; $1 }}');

// 4. Props replacements
code = code.replace(/style=\{tw\`(.*?)\`\}/g, 'className="$1"');
code = code.replace(/style=\{tw\`(.*?)\$\{(.*?)\}(.*?)\`\}/g, 'className={`$1${$2}$3`}');
code = code.replace(/onPress=\{/g, 'onClick={');
code = code.replace(/keyboardType="[^"]+"/g, ''); // HTML input type handled differently, just remove for now

// 5. Replace Location API
code = code.replace(/let \{ status \} = await Location.requestForegroundPermissionsAsync\(\);[\s\S]*?updateFormData\('koordinat', \`\$\{location.coords.latitude\}, \$\{location.coords.longitude\}\`\);/, `
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser ini.');
      return;
    }
    
    alert('Mengambil Lokasi... Harap izinkan akses lokasi di browser.');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateFormData('koordinat', \`\${position.coords.latitude}, \${position.coords.longitude}\`);
      },
      (error) => {
        alert('Gagal mengambil lokasi. Pastikan GPS aktif dan izin diberikan.');
      }
    );
`);

// 6. Replace ImagePicker API
code = code.replace(/const permissionResult = await ImagePicker[\s\S]*?setPhotos\(prev => \[\.\.\.prev, \{ uri: asset.uri, base64: asset.base64 \|\| '', keterangan: '' \}\]\);\n    \}/, `
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as any).files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          // Extract base64 part only if needed, but for preview we can just use the data URL
          const base64Str = base64Data.split(',')[1];
          setPhotos(prev => [...prev, { uri: base64Data, base64: base64Str, keterangan: '' }]);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
`);

// 7. Replace AsyncStorage with localStorage
code = code.replace(/AsyncStorage.getItem/g, 'Promise.resolve(localStorage.getItem');
code = code.replace(/AsyncStorage.setItem\((.*?), (.*?)\)/g, 'Promise.resolve(localStorage.setItem($1, $2))');
code = code.replace(/AsyncStorage.removeItem/g, 'Promise.resolve(localStorage.removeItem');

// 8. Replace Alert.alert
// Simple alerts
code = code.replace(/Alert\.alert\('([^']+)', '([^']+)'\)/g, 'alert("$1: $2")');
// Complex alerts will just use window.confirm or we manually fix them later

// 9. Replace Linking
code = code.replace(/Linking\.openURL\((.*?)\)/g, 'window.open($1, "_blank")');

fs.writeFileSync('src/app/pengawasan/mobile/FormBAP.tsx', code);
console.log("Translation done!");
