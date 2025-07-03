/**
 * 滚动文字组件
 * 功能：显示滚动的公司名称或其他文本
 */
import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

interface ScrollingTextProps {
  text: string;
  speed?: number; // 滚动速度，数字越小越快
  height?: number; // 组件高度
  backgroundColor?: string; // 背景颜色
  textColor?: string; // 文字颜色
  fontSize?: number; // 字体大小
}

const ScrollingText: React.FC<ScrollingTextProps> = ({
  text,
  speed = 50,
  height = 40,
  backgroundColor = '#f0f2f5',
  textColor = '#1890ff',
  fontSize = 16,
}) => {
  const scrollingStyle: React.CSSProperties = {
    width: '100%',
    height: `${height}px`,
    backgroundColor,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '4px',
    border: '1px solid #d9d9d9',
  };

  const textStyle: React.CSSProperties = {
    position: 'absolute',
    whiteSpace: 'nowrap',
    color: textColor,
    fontSize: `${fontSize}px`,
    fontWeight: 'bold',
    animation: `scrollLeft ${speed}s linear infinite`,
    paddingLeft: '100%', // 从右边开始
  };

  // 动态注入CSS动画
  React.useEffect(() => {
    const styleId = 'scrolling-text-animation';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes scrollLeft {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div style={scrollingStyle}>
      <div style={textStyle}>
        {text}
      </div>
    </div>
  );
};

export default ScrollingText; 