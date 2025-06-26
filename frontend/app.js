const { useState, useEffect, useRef } = React;

// API 基礎 URL
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// =================================================================
// Transaction Components
// =================================================================

// 顯示交易列表的組件
function TransactionList({ transactions, onDeleteTransaction, analysisResult = [] }) {
    if (!transactions || transactions.length === 0) {
        return <p>此案件目前沒有任何交易紀錄。</p>;
    }

    const anomalousIds = new Map(analysisResult.map(item => [item.id, item.reason]));

    return (
        <div>
            <h4>交易紀錄</h4>
            <ul style={{ paddingLeft: '20px' }}>
                {transactions.map(t => {
                    const isAnomalous = anomalousIds.has(t.id);
                    const reason = isAnomalous ? anomalousIds.get(t.id) : '';
                    const style = {
                        marginBottom: '10px',
                        borderBottom: '1px solid #eee',
                        padding: '10px',
                        backgroundColor: isAnomalous ? 'lightyellow' : 'transparent',
                        borderRadius: '5px'
                    };

                    return (
                        <li key={t.id} style={style} title={isAnomalous ? `異常原因: ${reason}` : ''}>
                            <div><strong>金額:</strong> ${t.amount}</div>
                            <div><strong>日期:</strong> {t.transaction_date}</div>
                            <div><strong>描述:</strong> {t.description || 'N/A'}</div>
                            <button onClick={() => onDeleteTransaction(t.id)} style={{ marginTop: '5px' }}>
                                刪除此交易
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

// 新增交易的表單組件
function TransactionForm({ caseId, onTransactionAdded }) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            setError("請輸入有效的正數金額。");
            return;
        }
        if (!transactionDate) {
            setError("請選擇交易日期。");
            return;
        }

        const transactionData = {
            amount: Number(amount),
            description,
            transaction_date: transactionDate,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/cases/${caseId}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: '未知的伺服器錯誤' }));
                throw new Error(`HTTP 錯誤！ 狀態: ${response.status} - ${errorData.detail}`);
            }

            // 清空表單
            setAmount('');
            setDescription('');
            setTransactionDate(new Date().toISOString().split('T')[0]);
            
            // 通知父組件刷新
            onTransactionAdded();

        } catch (err) {
            console.error(`為案件 #${caseId} 新增交易失敗:`, err);
            setError(err.message);
        }
    };

    return (
        <div style={{ marginTop: '20px', borderTop: '2px solid #007bff', paddingTop: '15px' }}>
            <h4>為此案件新增交易</h4>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label>金額: <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required /></label>
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>日期: <input type="date" value={transactionDate} onChange={e => setTransactionDate(e.target.value)} required /></label>
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>描述: <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ verticalAlign: 'top' }} /></label>
                </div>
                <button type="submit">新增交易</button>
                {error && <div style={{ color: 'red', marginTop: '10px' }}>錯誤: {error}</div>}
            </form>
        </div>
    );
}


// =================================================================
// Case Components
// =================================================================

// 顯示案件詳情的組件
function CaseDetail({ caseData, onBack, onTransactionChange }) {
    const [analysisResult, setAnalysisResult] = useState([]);
    const [analysisError, setAnalysisError] = useState(null);

    const handleDeleteTransaction = async (transactionId) => {
        if (!window.confirm(`您確定要刪除交易 #${transactionId} 嗎？`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: '未知的伺服器錯誤' }));
                throw new Error(`HTTP 錯誤！ 狀態: ${response.status} - ${errorData.detail}`);
            }
            
            // 通知父組件刷新
            onTransactionChange();
            // 清除舊的分析結果
            setAnalysisResult([]);

        } catch (err) {
            console.error(`刪除交易 #${transactionId} 失敗:`, err);
            alert(`刪除交易失敗: ${err.message}`);
        }
    };

    const handleAnalyzeTransactions = async () => {
        setAnalysisError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/cases/${caseData.id}/analyze`, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: '未知的伺服器錯誤' }));
                throw new Error(`HTTP 錯誤！ 狀態: ${response.status} - ${errorData.detail}`);
            }
            
            const result = await response.json();
            setAnalysisResult(result);
            if (result.length === 0) {
                alert("分析完成，未發現高額異常交易。");
            }

        } catch (err) {
            console.error(`分析案件 #${caseData.id} 失敗:`, err);
            setAnalysisError(`分析失敗: ${err.message}`);
        }
    };

    return (
        <div>
            <button onClick={onBack} style={{ marginBottom: '20px' }}>返回案件列表</button>
            <h1>案件詳情: {caseData.title}</h1>
            <p><strong>ID:</strong> {caseData.id}</p>
            <p><strong>描述:</strong> {caseData.description || '無'}</p>
            <hr />
            <button onClick={handleAnalyzeTransactions} style={{ marginBottom: '15px' }}>
                分析交易
            </button>
            {analysisError && <div style={{ color: 'red', marginBottom: '15px' }}>{analysisError}</div>}
            <TransactionList
                transactions={caseData.transactions}
                onDeleteTransaction={handleDeleteTransaction}
                analysisResult={analysisResult}
            />
            <TransactionForm caseId={caseData.id} onTransactionAdded={() => {
                onTransactionChange();
                setAnalysisResult([]); // 新增交易後清除分析結果
            }} />
        </div>
    );
}


// 顯示案件列表的組件
function CaseList({ cases, onEdit, onDelete, onViewDetails }) {
    return (
        <div>
            <h1>案件列表</h1>
            <ul>
                {cases.map(c => (
                    <li key={c.id} style={{ marginBottom: '10px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                        <strong>{c.id}:</strong> {c.title}
                        {c.description && <p style={{ marginLeft: '20px', marginTop: '5px', color: '#555' }}>{c.description}</p>}
                        <div style={{ marginTop: '10px' }}>
                            <button onClick={() => onViewDetails(c.id)}>查看詳情</button>
                            <button onClick={() => onEdit(c)} style={{ marginLeft: '10px' }}>編輯</button>
                            <button onClick={() => onDelete(c.id)} style={{ marginLeft: '10px' }}>刪除</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// 建立或更新案件的表單組件
function CaseForm({ onCaseCreated, onCaseUpdated, editingCase, setEditingCase }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState(null);
    const formRef = useRef(null);

    useEffect(() => {
        if (editingCase) {
            setTitle(editingCase.title);
            setDescription(editingCase.description || "");
            formRef.current.scrollIntoView({ behavior: 'smooth' });
        } else {
            setTitle("");
            setDescription("");
        }
    }, [editingCase]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!title.trim()) {
            setError("標題為必填欄位。");
            return;
        }

        const caseData = { title, description };
        const isEditing = !!editingCase;
        const url = isEditing
            ? `${API_BASE_URL}/cases/${editingCase.id}`
            : `${API_BASE_URL}/cases/`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(caseData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: '未知的伺服器錯誤' }));
                throw new Error(`HTTP 錯誤！ 狀態: ${response.status} - ${errorData.detail}`);
            }

            setTitle("");
            setDescription("");
            setEditingCase(null);
            
            if (isEditing) {
                onCaseUpdated();
            } else {
                onCaseCreated();
            }

        } catch (err) {
            console.error(`${isEditing ? '更新' : '建立'}案件失敗:`, err);
            setError(err.message);
        }
    };

    return (
        <div ref={formRef}>
            <h2>{editingCase ? `編輯案件 #${editingCase.id}` : '建立新案件'}</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label>標題: <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginLeft: '5px', width: '300px' }} /></label>
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>描述: <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ marginLeft: '5px', width: '300px', height: '60px', verticalAlign: 'top' }} /></label>
                </div>
                <button type="submit">{editingCase ? '更新案件' : '建立案件'}</button>
                {editingCase && (
                    <button type="button" onClick={() => setEditingCase(null)} style={{ marginLeft: '10px' }}>取消編輯</button>
                )}
            </form>
            {error && <div style={{ color: 'red', marginTop: '10px' }}>錯誤: {error}</div>}
        </div>
    );
}

// =================================================================
// Main App Component
// =================================================================

function App() {
    const [cases, setCases] = useState([]);
    const [error, setError] = useState(null);
    const [editingCase, setEditingCase] = useState(null);
    const [selectedCase, setSelectedCase] = useState(null); // 追蹤被選中查看詳情的案件

    const fetchCases = async () => {
        try {
            setError(null);
            const response = await fetch(`${API_BASE_URL}/cases/`);
            if (!response.ok) {
                throw new Error(`HTTP 錯誤！ 狀態: ${response.status}`);
            }
            const data = await response.json();
            setCases(data.sort((a, b) => b.id - a.id));
        } catch (err) {
            console.error("讀取案件列表失敗:", err);
            setError(err.message);
        }
    };
    
    const fetchSingleCase = async (caseId) => {
        try {
            setError(null);
            const response = await fetch(`${API_BASE_URL}/cases/${caseId}`);
            if (!response.ok) {
                throw new Error(`HTTP 錯誤！ 狀態: ${response.status}`);
            }
            const data = await response.json();
            setSelectedCase(data);
        } catch (err) {
            console.error(`讀取案件 #${caseId} 失敗:`, err);
            setError(err.message);
            setSelectedCase(null); // 發生錯誤時清除選擇
        }
    };

    const handleDeleteCase = async (caseId) => {
        if (!window.confirm(`您確定要刪除案件 #${caseId} 嗎？這將會一併刪除所有關聯的交易紀錄。`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: '未知的伺服器錯誤' }));
                throw new Error(`HTTP 錯誤！ 狀態: ${response.status} - ${errorData.detail}`);
            }
            
            fetchCases();

        } catch (err) {
            console.error(`刪除案件 #${caseId} 失敗:`, err);
            setError(`刪除案件失敗: ${err.message}`);
        }
    };

    useEffect(() => {
        fetchCases();
    }, []);

    const handleEdit = (caseToEdit) => {
        setSelectedCase(null); // 返回列表視圖以進行編輯
        setEditingCase(caseToEdit);
    };

    const handleCaseUpdated = () => {
        setEditingCase(null);
        fetchCases();
    };
    
    const handleViewDetails = (caseId) => {
        fetchSingleCase(caseId);
    };
    
    const handleTransactionChange = () => {
        // 交易紀錄變更後，重新載入當前案件的詳細資料
        if (selectedCase) {
            fetchSingleCase(selectedCase.id);
        }
    };

    if (selectedCase) {
        return (
            <CaseDetail 
                caseData={selectedCase} 
                onBack={() => setSelectedCase(null)}
                onTransactionChange={handleTransactionChange}
            />
        );
    }

    return (
        <div>
            <CaseForm
                onCaseCreated={fetchCases}
                onCaseUpdated={handleCaseUpdated}
                editingCase={editingCase}
                setEditingCase={setEditingCase}
            />
            <hr style={{ margin: '20px 0' }} />
            {error && <div style={{ color: 'red' }}>錯誤: {error}</div>}
            <CaseList
                cases={cases}
                onEdit={handleEdit}
                onDelete={handleDeleteCase}
                onViewDetails={handleViewDetails}
            />
        </div>
    );
}

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);