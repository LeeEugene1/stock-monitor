import { useStockNews } from '../hooks/useStockNews';

interface Props {
  code: string;
}

function formatTime(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export function StockNews({ code }: Props) {
  const { data, loading, error } = useStockNews(code);

  if (loading) {
    return <div className="news-loading">뉴스 로딩 중...</div>;
  }

  if (error) {
    return <div className="news-error">뉴스를 불러올 수 없습니다</div>;
  }

  if (data.length === 0) {
    return <div className="news-empty">관련 뉴스가 없습니다</div>;
  }

  return (
    <div className="stock-news">
      <h4 className="news-title-header">관련 뉴스</h4>
      <ul className="news-list">
        {data.map((item) => (
          <li key={item.id} className="news-item">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="news-thumb"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="news-content">
                <h5 className="news-title">{item.title}</h5>
                <p className="news-body">{item.body}</p>
                <div className="news-meta">
                  <span className="news-office">{item.office}</span>
                  <span className="news-time">{formatTime(item.datetime)}</span>
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
