import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../lib/api';
import { Article } from '../types';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calendar, User, Share2, BookOpen, Clock } from 'lucide-react';

export const ArticleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const res = await api.articles.get(slug);
        if (res.success && res.data) {
          setArticle(res.data);

          // SEO updates dynamically (react-helmet alternative without version conflicts)
          const titleText = res.data.seo_title || `${res.data.title} | LCS Edukasi`;
          document.title = titleText;

          const descText = res.data.seo_description || 'Panduan edukasi jual beli kendaraan second dan suku cadang aman.';
          let metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) {
            metaDesc.setAttribute('content', descText);
          } else {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = descText;
            document.head.appendChild(meta);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticle();

    // Cleanup page title
    return () => {
      document.title = 'LCS Motor - Sistem Jual Beli Kendaraan & Suku Cadang';
    };
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500 text-sm">
        Memuat konten artikel edukasi...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500 text-sm space-y-4">
        <p>Artikel tidak ditemukan.</p>
        <Link to="/articles" className="text-green-600 font-semibold flex items-center justify-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Edukasi
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <Helmet>
        <title>{article.seo_title || `${article.title} | LCS Edukasi`}</title>
        <meta name="description" content={article.seo_description || (article.content ? article.content.substring(0, 150) + '...' : 'Panduan edukasi jual beli kendaraan second dan suku cadang aman.')} />
      </Helmet>
      
      {/* Navigation & Actions Header */}
      <div className="flex justify-between items-center">
        <Link to="/articles" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Semua Artikel
        </Link>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg shadow-2xs transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          {copied ? 'Tersalin ✓' : 'Bagikan Link'}
        </button>
      </div>

      {/* Main Container */}
      <article className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
        
        {/* Cover banner */}
        <div className="aspect-21/9 bg-slate-100 overflow-hidden relative">
          <img
            src={article.cover_url}
            alt={article.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-6 left-6 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
            {article.category}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-10 space-y-6">
          
          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-xs text-slate-400 border-b border-slate-50 pb-5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-300" />
              <span>{new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-300" />
              <span>Oleh: Tim Edukasi LCS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-300" />
              <span>Saran: 5 Menit Baca</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display font-bold text-slate-900 text-2xl sm:text-3xl lg:text-4xl leading-tight tracking-tight">
            {article.title}
          </h1>

          {/* Markdown Content Parser */}
          <div className="markdown-body">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>

          {/* Security Disclaimer Box */}
          <div className="bg-green-50/50 rounded-2xl p-5 border border-green-100/60 mt-10 space-y-2.5">
            <h4 className="font-display font-bold text-green-900 text-sm flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-green-600" />
              Komitmen Perlindungan Transaksi Aman
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seluruh transaksi di platform LCS dilindungi sistem Escrow (Rekening Bersama) yang dikelola tim administrasi secara manual. Jangan pernah melakukan transfer dana langsung ke penjual di luar jalur platform. Laporkan kecurigaan apa pun langsung kepada Admin Sistem.
            </p>
          </div>

        </div>

      </article>

    </div>
  );
};
