import React, { useEffect, useState } from 'react';
import './App.css';
import { db } from './Firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc
} from 'firebase/firestore';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const names = ['Huy', 'Hoàng', 'Vũ', 'Ngọc', 'Hồng', 'Tài', 'Tuấn'];

function App() {
  const [balances, setBalances] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const balancesRef = collection(db, 'balances');
      const snapshot = await getDocs(balancesRef);
      const data = {};
      snapshot.forEach(doc => {
        data[doc.id] = doc.data().amount;
      });

      if (Object.keys(data).length === 0) {
        names.forEach(async name => {
          await setDoc(doc(db, 'balances', name), { amount: 0 });
          data[name] = 0;
        });
      }

      setBalances(data);
    };

    fetchData();
  }, []);

  const updateBalance = async (name, change) => {
    const newAmount = (balances[name] || 0) + change;

    try {
      // Chỉ cho phép cộng tiền
      if (change < 0) return;

      await updateDoc(doc(db, 'balances', name), {
        amount: newAmount
      });

      setBalances(prev => ({
        ...prev,
        [name]: newAmount
      }));

      const gainMessages = [
        'Lại có thêm 2k , dốt vcl  😎',
        'Sướng chưa, ngu không chịu được 💰',
        'ngu  chi mà ngu ác  ✨',
        'Lại hạng 5 , ngu mất tiền là đúng 😂',
        'Hạng 5 là do mình ngu chứ do ai 🧧',
        'Không đổ lỗi , ngu là phải chịu  😎',
        'chán không tả nổi , ngu thế  😎',
        'ngu ơi là ngu , kém ơi là kém 😎',
        'thứ ăn hại 😎',
        'có thế mà hạng 5 , đần ác 😎',
        'dốt thua mỗi Polpot 😎',
      ];

      const message = gainMessages[Math.floor(Math.random() * gainMessages.length)];

      toast.success(message, { position: "top-center", autoClose: 2000 });
    } catch (error) {
      toast.error('Lỗi khi cập nhật dữ liệu! 😵');
    }
  };

  return (
    <div className="container">
      <ToastContainer />
      <div className="title">💰 Tiền mất tật mang ( Stupid )</div>
      {names.map(name => (
        <div className="user-row" key={name}>
          <div className="user-name">{name}</div>
          <div className="user-amount">{balances[name] || 0} VND</div>
          <div className="button-group">
            <button className="increase" onClick={() => updateBalance(name, 2000)}>+2k</button>
            {/* Xóa hoặc vô hiệu hóa nút trừ tiền */}
            {/* <button className="decrease" onClick={() => updateBalance(name, -2000)}>-2k</button> */}
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
