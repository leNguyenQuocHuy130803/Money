import React, { useEffect, useState } from 'react';
import './App.css';
import { db } from './Firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

const names = ['Huy', 'Hoàng', 'Vũ', 'Ngọc', 'Hồng', 'Tài', 'Tuấn'];

function App() {
  const [balances, setBalances] = useState({});
  const [weeklySummaries, setWeeklySummaries] = useState([]);
  const [history, setHistory] = useState([]);

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

    const fetchWeeklySummaries = async () => {
      const ref = collection(db, 'weekly_summaries');
      const snapshot = await getDocs(ref);
      const summaries = [];
      snapshot.forEach(doc => summaries.push(doc.data()));
      summaries.sort((a, b) => a.week - b.week);
      setWeeklySummaries(summaries);
    };

    const fetchHistory = async () => {
      const ref = collection(db, 'history');
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
      setHistory(data);
    };

    fetchData();
    fetchWeeklySummaries();
    fetchHistory();
  }, []);

  const updateBalance = async (name, change) => {
    const newAmount = (balances[name] || 0) + change;

    try {
      if (change < 0) return;

      await updateDoc(doc(db, 'balances', name), { amount: newAmount });

      setBalances(prev => ({
        ...prev,
        [name]: newAmount
      }));

      // Ghi lịch sử cộng tiền
      await addDoc(collection(db, 'history'), {
        name,
        amount: change,
        timestamp: serverTimestamp()
      });

      const gainMessages = [
        'Lại có thêm 2k , dốt vcl 😎',
        'Sướng chưa, ngu không chịu được 💰',
        'ngu chi mà ngu ác ✨',
        'Lại hạng 5 , ngu mất tiền là đúng 😂',
        'Không đổ lỗi , ngu là phải chịu 😎',
      ];

      const message = gainMessages[Math.floor(Math.random() * gainMessages.length)];
      toast.success(message, { position: "top-center", autoClose: 2000 });

      // Reload lịch sử
      const ref = collection(db, 'history');
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
      setHistory(data);

    } catch (error) {
      toast.error('Lỗi khi cập nhật dữ liệu! 😵');
    }
  };

  const confirmAndUpdate = (name) => {
    confirmAlert({
      title: 'Xác nhận hành động',
      message: `Bạn có chắc chắn muốn thêm 2k cho ${name}?`,
      buttons: [
        {
          label: 'Chắc chắn',
          onClick: () => updateBalance(name, 2000)
        },
        {
          label: 'Hủy',
          onClick: () => toast.info('Đã huỷ')
        }
      ]
    });
  };

  const handleWeeklyTotal = async () => {
    const total = Object.values(balances).reduce((a, b) => a + b, 0);
    const loser = Object.entries(balances).reduce((a, b) => (b[1] > a[1] ? b : a));
    const currentWeek = weeklySummaries.length + 1;

    try {
      await setDoc(doc(db, 'weekly_summaries', `week_${currentWeek}`), {
        week: currentWeek,
        total,
        loser: loser[0],
        loserAmount: loser[1]
      });

      toast.success(`📊 Tổng tuần là ${total} VND. ${loser[0]} gà nhất 🐔 với ${loser[1]} VND.`);

      setWeeklySummaries(prev => [
        ...prev,
        { week: currentWeek, total, loser: loser[0], loserAmount: loser[1] }
      ]);
    } catch (error) {
      toast.error('❌ Lỗi khi lưu kết quả tuần');
    }
  };

  const handleDeleteAllWeeklySummaries = async () => {
    confirmAlert({
      title: 'Xác nhận xoá',
      message: 'Bạn có chắc chắn muốn xoá toàn bộ lịch sử tổng tuần không?',
      buttons: [
        {
          label: 'Xoá hết',
          onClick: async () => {
            try {
              const ref = collection(db, 'weekly_summaries');
              const snapshot = await getDocs(ref);
              const deletePromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
              await Promise.all(deletePromises);
              setWeeklySummaries([]);
              toast.success('🗑️ Đã xoá toàn bộ lịch sử tổng tuần!');
            } catch (error) {
              toast.error('❌ Lỗi khi xoá lịch sử!');
            }
          }
        },
        { label: 'Hủy', onClick: () => toast.info('Đã huỷ') }
      ]
    });
  };

  const handleDeleteSingleWeek = (weekNumber) => {
    confirmAlert({
      title: `Xoá tuần ${weekNumber}`,
      message: `Bạn có chắc muốn xoá dữ liệu của tuần ${weekNumber}?`,
      buttons: [
        {
          label: 'Xoá',
          onClick: async () => {
            try {
              const weekDocRef = doc(db, 'weekly_summaries', `week_${weekNumber}`);
              await deleteDoc(weekDocRef);
              setWeeklySummaries(prev => prev.filter(summary => summary.week !== weekNumber));
              toast.success(`✅ Đã xoá tuần ${weekNumber}`);
            } catch (error) {
              toast.error('❌ Lỗi khi xoá tuần!');
            }
          }
        },
        { label: 'Huỷ', onClick: () => toast.info('Đã huỷ') }
      ]
    });
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
            <button className="increase" onClick={() => confirmAndUpdate(name)}>+2k</button>
          </div>
        </div>
      ))}

      <button className="weekly-total" onClick={handleWeeklyTotal}>📊 Tổng tiền tuần</button>

      {/* history sumarry money week */}
      {/* <div className="history">
        <h3>Lịch sử tổng tuần</h3>
        <button className="delete-all" onClick={handleDeleteAllWeeklySummaries}>
          🗑️ Xoá toàn bộ lịch sử
        </button>
        {weeklySummaries.length === 0 ? (
          <p>Chưa có dữ liệu tổng tuần nào.</p>
        ) : (
          weeklySummaries.map((entry, index) => (
            <div key={index} className="summary">
              <span>
                <strong>Tuần {entry.week}</strong> — Tổng: {entry.total} VND — 🐔 {entry.loser} ({entry.loserAmount} VND)
              </span>
              <button className="delete-week" onClick={() => handleDeleteSingleWeek(entry.week)}>Xoá</button>
            </div>
          ))
        )}
      </div>

      <div className="history-log">
        <h3>📜 Lịch sử cộng tiền</h3>
        {history.length === 0 ? (
          <p>Chưa có lịch sử nào.</p>
        ) : (
          history.map(entry => (
            <div key={entry.id} className="history-entry">
              <span>{entry.name} được cộng {entry.amount} VND</span>
              <span style={{ fontSize: '12px', color: '#888' }}>
                {entry.timestamp?.toDate().toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div> */}

      <div className="history">
        {/* Lịch sử tổng tuần */}
        <div className="history-section">
          <div className="section-title">
            🧾 <span>Lịch sử tổng tuần</span>
          </div>
          <button className="delete-all" onClick={handleDeleteAllWeeklySummaries}>
            🗑️ Xoá toàn bộ lịch sử
          </button>
          {weeklySummaries.length === 0 ? (
            <p className="no-data">Chưa có dữ liệu tổng tuần nào.</p>
          ) : (
            weeklySummaries.map((entry, index) => (
              <div key={index} className="summary">
                <span>
                  <strong>Tuần {entry.week}</strong> — Tổng: {entry.total.toLocaleString()} VND — 🐔 {entry.loser} ({entry.loserAmount.toLocaleString()} VND)
                </span>
                <button className="delete-week" onClick={() => handleDeleteSingleWeek(entry.week)}>Xoá</button>
              </div>
            ))
          )}
        </div>

        {/* Lịch sử cộng tiền */}
        <div className="history-section">
          <div className="section-title">
            📜 <span>Lịch sử cộng tiền</span>
          </div>
          {history.length === 0 ? (
            <p className="no-data">Chưa có lịch sử nào.</p>
          ) : (
            history.map(entry => (
              <div key={entry.id} className="summary">
                <span>{entry.name} được cộng {entry.amount.toLocaleString()} VND</span>
                <span style={{ fontSize: '12px', color: '#888' }}>
                  {entry.timestamp?.toDate().toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

export default App;
