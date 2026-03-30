// ==========================================
// Dashboard Charts: Call History Line Chart
// Lightweight Canvas-based chart (no external libs)
// Depends on: supabase-init.js, auth.js
// ==========================================

const DashboardCharts = {

  async init() {
    var container = document.getElementById('chart-calls-7days');
    if (!container) return;

    try {
      var data = await this._fetchLast7Days();
      this._renderChart(container, data);

      // Re-render on resize for responsiveness
      var resizeTimeout = null;
      var self = this;
      window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
          self._renderChart(container, data);
        }, 200);
      });
    } catch (err) {
      if (typeof Logger !== 'undefined') Logger.warn('DashboardCharts.init', err);
      container.innerHTML = '<div style="color:var(--tx3);font-size:13px;text-align:center;padding:30px;">Chart nicht verfuegbar</div>';
    }
  },

  async _fetchLast7Days() {
    var days = [];
    var dayLabels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    var today = new Date();
    var labels = [];
    var dateKeys = [];

    for (var i = 6; i >= 0; i--) {
      var d = new Date(today);
      d.setDate(d.getDate() - i);
      labels.push(dayLabels[d.getDay()]);
      dateKeys.push(d.toISOString().slice(0, 10));
      days.push(0);
    }

    try {
      var userId = typeof auth !== 'undefined' ? await auth.getEffectiveUserId() : null;
      if (!userId) return { labels: labels, values: days };

      var startDate = dateKeys[0] + 'T00:00:00';
      var endDate = dateKeys[6] + 'T23:59:59';

      var res = await supabaseClient
        .from('calls')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      var calls = res.data || [];
      calls.forEach(function(c) {
        var callDate = c.created_at.slice(0, 10);
        var idx = dateKeys.indexOf(callDate);
        if (idx !== -1) days[idx]++;
      });
    } catch (_err) {
      // Return zeros on error
    }

    return { labels: labels, values: days };
  },

  _renderChart(container, data) {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Create or reuse canvas
    var canvas = container.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '180px';
      canvas.style.display = 'block';
      container.innerHTML = '';
      container.appendChild(canvas);
    }

    var rect = container.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var width = Math.max(rect.width, 200);
    var height = 180;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    var values = data.values;
    var labels = data.labels;
    var maxVal = Math.max.apply(null, values);
    if (maxVal === 0) maxVal = 5; // Minimum scale

    var padLeft = 36;
    var padRight = 16;
    var padTop = 20;
    var padBottom = 30;
    var chartW = width - padLeft - padRight;
    var chartH = height - padTop - padBottom;

    var textColor = isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.4)';
    var gridColor = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
    var purple = '#7c3aed';

    // Y-axis grid lines (4 lines)
    ctx.font = '11px Manrope, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (var g = 0; g <= 4; g++) {
      var gy = padTop + chartH - (g / 4) * chartH;
      var gVal = Math.round((g / 4) * maxVal);
      ctx.fillStyle = textColor;
      ctx.fillText(gVal.toString(), padLeft - 8, gy);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padLeft, gy);
      ctx.lineTo(padLeft + chartW, gy);
      ctx.stroke();
    }

    // Calculate points
    var points = [];
    for (var p = 0; p < values.length; p++) {
      var px = padLeft + (p / (values.length - 1)) * chartW;
      var py = padTop + chartH - (values[p] / maxVal) * chartH;
      points.push({ x: px, y: py });
    }

    // Gradient fill below line
    var gradient = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
    gradient.addColorStop(0, isDark ? 'rgba(124,58,237,.35)' : 'rgba(124,58,237,.2)');
    gradient.addColorStop(1, isDark ? 'rgba(124,58,237,.02)' : 'rgba(124,58,237,.01)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, padTop + chartH);
    for (var f = 0; f < points.length; f++) {
      ctx.lineTo(points[f].x, points[f].y);
    }
    ctx.lineTo(points[points.length - 1].x, padTop + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var l = 1; l < points.length; l++) {
      ctx.lineTo(points[l].x, points[l].y);
    }
    ctx.strokeStyle = purple;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw dots
    for (var d = 0; d < points.length; d++) {
      ctx.beginPath();
      ctx.arc(points[d].x, points[d].y, 4, 0, Math.PI * 2);
      ctx.fillStyle = purple;
      ctx.fill();
      ctx.strokeStyle = isDark ? '#1a1a2e' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // X-axis labels
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '11px Manrope, sans-serif';
    for (var x = 0; x < labels.length; x++) {
      var lx = padLeft + (x / (labels.length - 1)) * chartW;
      ctx.fillText(labels[x], lx, padTop + chartH + 10);
    }
  }
};

window.DashboardCharts = DashboardCharts;
