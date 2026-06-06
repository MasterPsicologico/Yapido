const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'studio-4796645076-6f375';
const clientEmail = 'firebase-adminsdk-fbsvc@studio-4796645076-6f375.iam.gserviceaccount.com';
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDRteuvcG+Rqkzv
fZgZCDhtcy6oxB0YPbLQheaKk+KtQ4nWlbBcBK00/Y9rUEPlC7JW576QBTaJk6NE
rp/2KsH9RP11s7alqhwG85xQ7gbz7yWNiJzlyUIVRclSxzovwfS8hlGzNaGdKIJj
Swh0bb22b+gYmE6YrxGNZnf5TYkGQfWXeaeiqiprgLsYhtEAJKeWp+xMMXxPAK6m
JL92QU1MlYPEXAZf/rXefTNsB3kzYiY0sotmsrbCLM8TB88IY/jkKwfSe29Mpopc
/mBEaoDAFFF+SEe4EnBxR058giQSgTRmUpxW65D8JjYT3qKM3wDK0rMfytgL0Rrb
LZG5LUT9AgMBAAECggEAXMxUQVuPO1WxWs7oZbdSBPjRvmOd/lKbFJQUGuFrDsHS
tm6hzm5RWSAU/WdUy/+7iKJfHKr54bI/rs5ZQZzVH+aOBC4k1jUq1tapJtTVpc7+
/pzj1PkUsYYimutHL8fzrRMBBzzlyb4ZyKd009SV/SuS+IM5UG4z5a7gyySIzIfJ
bwYIA/OwTC3X9sQkLDbnmjd6+wKu3VPnl/w5qbc08E1z2Dz35wLgHCFOnycgWgGn
rldDNeUjQOXBwe4nmBUy+s3Ypifq3mlP2WKRfPbtNMub+ILCsqz2UrHhSbzv5GSW
THfVzWFOacnVZ0DhcqpAambD3rqroefm5zJpNUe+fwKBgQDtVrNAHVJfN7C+ycJK
RLioFQzRgCdrXefou4/6s7Fepxt3N447wqm2j26uDukkPVl0BD6VlQFV1C2RxL0H
9OUk1RqJFpniL41DGtZPionGLHQXke7tj0O64N2nFx3k8TxdbaE9mlHqCKVkWULA
M4I+wf8HoCaRYmGaFotBqI8s0wKBgQDiMxslvAyWE12vy4C4Cf1g8mOMJ5QP6KxL
ILDDdD3yMMZNsv9Wrx8K/wzNQlaZEETgHA/lemd19xNxsMoVD12yzSxwT1M57gri
BzCiK8drRyIlZf0xImx+xnc4yGlNtuF/nn0QrH99TXGZXE/P3lHDPhOk8/7ptVNo
Ls2gGgBk7wKBgQDKBbfUxmC8TiIzdHfeUfrAkBJ2LdjgCnIB583Zv6UmBaZaZz65
3awqipLStDx9rX78QzSmjMwzK8WSQ94H7Mwz+vV4ZXWdU46x5SExWaKGvoYfHgg7
zGwBobDqrsGyhCk2+b97OWWqiauG7HfmNLIUC3uzGP5bWFvuFmx4+irNIwKBgBsX
NdQiHnvG2/yW6dag06jNvuBlSRVSr3fb9W+jN1wPPWDG5E/Ub2pYu4bFwCtayHTy
x3CbZVK6gainHLzC91zXt8/HoFcazFDfvZJeneaaQVurSFSfI9FXIaY6UmpNUdp/
98iMcERohwdwB9sEbFRu1dl2o3wIDHI40MWw94UfAoGBAKceHB7c/V0cii+kEBsd
Q0gUK1W0MDOMNL66ucuptIZvsm+ULBMYyA+IxXi0LIY5qCb4iTNw9jta3ybs87Qm
JO3WC5Myicg9xIuLCpVgjpchkqbc7d6tbkBm8YkYeqqcnnLcjif1smRIIRxVyQjD
cysFJrqezI9x1px47upl3xF8
-----END PRIVATE KEY-----`.replace(/\\n/g, '\n');

async function setup() {
  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    }
    
    const db = getFirestore();
    
    console.log('🔧 Configurando superadmin en Firestore...');
    
    const superAdminRef = db.collection('appConfig').doc('superAdmins');
    
    await superAdminRef.set({
      adminIds: {
        '9qjHXRHfKfS2LrlE6074rR9JOm83': true,
        'OUeZfonX8AY4YHRI4qLCc1WiVFN2': true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    console.log('✅ Superadmin configurado correctamente!');
    
    console.log('\n🔧 Verificando estructura de datos...');
    
    const categories = [
      { id: 'lavadoras', name: 'Alquiler de Lavadoras', icon: 'washing-machine', active: true },
      { id: 'comida', name: 'Comida', icon: 'utensils', active: true },
      { id: 'supermercado', name: 'Supermercado', icon: 'shopping-cart', active: true },
      { id: 'farmacia', name: 'Farmacia', icon: 'pill', active: true },
    ];
    
    for (const cat of categories) {
      await db.collection('mainCategories').doc(cat.id).set(cat, { merge: true });
    }
    
    console.log('✅ Categorías creadas');
    
    console.log('\n🔧 Creando configuración de app...');
    
    await db.collection('appConfig').doc('settings').set({
      version: '1.0.0',
      name: 'Yapido',
      description: 'Logística y Alquiler de Lavadoras',
      paymentMethods: ['cash', 'digital', 'nequi', 'daviplata'],
      maxOrderAmount: 50000000,
      minOrderAmount: 5000,
      deliveryFeeBase: 3500,
      deliveryFeePerKm: 500,
      createdAt: new Date().toISOString(),
    }, { merge: true });
    
    console.log('✅ Configuración de app creada');
    
    console.log('\n🎉 ¡Configuración completada exitosamente!');
    console.log('\nAhora puedes ejecutar: npm run dev');
    console.log('Y la app funcionará correctamente.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setup();