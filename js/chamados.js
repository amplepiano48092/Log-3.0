$(document).ready(function() {
    if (!Auth.requireAuth()) return;
    
    const path = window.location.pathname.split('/').pop();
    
    if (path === 'novo-chamado.html') {
        initNovoChamado();
    } else if (path === 'chamados.html') {
        initListaChamados();
    } else if (path === 'detalhe-chamado.html') {
        initDetalheChamado();
    }
});

function initNovoChamado() {
    $('#formNovoChamado').on('submit', function(e) {
        e.preventDefault();
        
        const user = Auth.getCurrentUser();
        const chamado = {
            titulo: $('#titulo').val(),
            descricao: $('#descricao').val(),
            prioridade: $('#prioridade').val(),
            localizacao: $('#localizacao').val(),
            equipamento: $('#equipamento').val(),
            usuario_id: user.id,
            status: 'aberto',
            tecnico_id: null
        };
        
        DB.addChamado(chamado);
        alert('Chamado criado com sucesso!');
        window.location.href = 'chamados.html';
    });
}

function initListaChamados() {
    carregarChamados();
    
    $('#aplicarFiltros').on('click', function() {
        carregarChamados();
    });
    
    $('#limparFiltros').on('click', function() {
        $('#filtroStatus').val('todos');
        $('#filtroPrioridade').val('todos');
        carregarChamados();
    });
}

function carregarChamados() {
    const user = Auth.getCurrentUser();
    let chamados = DB.getChamados();
    
    if (!user.is_admin) {
        chamados = chamados.filter(c => c.usuario_id === user.id);
    }
    
    const status = $('#filtroStatus').val();
    const prioridade = $('#filtroPrioridade').val();
    
    if (status && status !== 'todos') {
        chamados = chamados.filter(c => c.status === status);
    }
    
    if (prioridade && prioridade !== 'todos') {
        chamados = chamados.filter(c => c.prioridade === prioridade);
    }
    
    chamados.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));
    
    if (chamados.length === 0) {
        $('#tabela-chamados').html('<tr><td colspan="8" class="text-center">Nenhum chamado encontrado.</td></tr>');
        return;
    }
    
    let html = '';
    chamados.forEach(chamado => {
        const criador = DB.getUsuarioById(chamado.usuario_id);
        const tecnico = chamado.tecnico_id ? DB.getUsuarioById(chamado.tecnico_id) : null;
        
        const statusClass = {
            'aberto': 'bg-warning',
            'em_andamento': 'bg-info',
            'resolvido': 'bg-success'
        }[chamado.status] || 'bg-secondary';
        
        const prioridadeClass = {
            'baixa': 'bg-success',
            'media': 'bg-info',
            'alta': 'bg-warning',
            'urgente': 'bg-danger'
        }[chamado.prioridade] || 'bg-secondary';
        
        html += `
            <tr>
                <td>#${chamado.id}</td>
                <td>${chamado.titulo.substring(0, 50)}${chamado.titulo.length > 50 ? '...' : ''}</td>
                <td><span class="badge ${statusClass}">${chamado.status.replace('_', ' ')}</span></td>
                <td><span class="badge ${prioridadeClass}">${chamado.prioridade}</span></td>
                <td>${criador ? criador.nome : 'N/A'}</td>
                <td>${tecnico ? tecnico.nome : 'Não atribuído'}</td>
                <td>${new Date(chamado.data_criacao).toLocaleDateString('pt-BR')}</td>
                <td>
                    <a href="detalhe-chamado.html?id=${chamado.id}" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-eye"></i>
                    </a>
                </td>
            </tr>
        `;
    });
    
    $('#tabela-chamados').html(html);
}

function initDetalheChamado() {
    const urlParams = new URLSearchParams(window.location.search);
    const chamadoId = parseInt(urlParams.get('id'));
    
    if (!chamadoId) {
        window.location.href = 'chamados.html';
        return;
    }
    
    const chamado = DB.getChamadoById(chamadoId);
    const user = Auth.getCurrentUser();
    
    if (!chamado || (!user.is_admin && chamado.usuario_id !== user.id)) {
        alert('Chamado não encontrado ou sem permissão');
        window.location.href = 'chamados.html';
        return;
    }
    
    preencherDetalheChamado(chamado);
    carregarHistorico(chamadoId);
    
    if (user.is_admin) {
        carregarTecnicos(chamado);
        
        $('#formAtualizarChamado').on('submit', function(e) {
            e.preventDefault();
            atualizarChamado(chamadoId);
        });
    }
}

function preencherDetalheChamado(chamado) {
    const criador = DB.getUsuarioById(chamado.usuario_id);
    const tecnico = chamado.tecnico_id ? DB.getUsuarioById(chamado.tecnico_id) : null;
    
    $('#chamado-titulo').text(`Chamado #${chamado.id} - ${chamado.titulo}`);
    
    const statusClass = {
        'aberto': 'bg-warning',
        'em_andamento': 'bg-info',
        'resolvido': 'bg-success'
    }[chamado.status] || 'bg-secondary';
    
    const prioridadeClass = {
        'baixa': 'bg-success',
        'media': 'bg-info',
        'alta': 'bg-warning',
        'urgente': 'bg-danger'
    }[chamado.prioridade] || 'bg-secondary';
    
    $('#chamado-status').html(`
        <span class="badge ${statusClass}">${chamado.status.replace('_', ' ')}</span>
        <span class="badge ${prioridadeClass} ms-2">${chamado.prioridade.toUpperCase()}</span>
    `);
    
    $('#chamado-info').html(`
        <div class="col-md-6">
            <p><strong>Criado por:</strong> ${criador ? criador.nome : 'N/A'}</p>
            <p><strong>Data de criação:</strong> ${new Date(chamado.data_criacao).toLocaleString('pt-BR')}</p>
        </div>
        <div class="col-md-6">
            <p><strong>Técnico:</strong> ${tecnico ? tecnico.nome : 'Não atribuído'}</p>
            ${chamado.data_atualizacao ? `<p><strong>Última atualização:</strong> ${new Date(chamado.data_atualizacao).toLocaleString('pt-BR')}</p>` : ''}
        </div>
    `);
    
    $('#chamado-localizacao').html(chamado.localizacao ? `<p><strong>Localização:</strong> ${chamado.localizacao}</p>` : '');
    $('#chamado-equipamento').html(chamado.equipamento ? `<p><strong>Equipamento:</strong> ${chamado.equipamento}</p>` : '');
    $('#chamado-descricao').text(chamado.descricao);
}

function carregarHistorico(chamadoId) {
    const historico = DB.getHistoricoByChamado(chamadoId);
    
    if (historico.length === 0) {
        $('#historico-container').html('<p class="text-muted">Nenhum histórico disponível.</p>');
        return;
    }
    
    let html = '';
    historico.forEach(item => {
        const usuario = DB.getUsuarioById(item.usuario_id);
        html += `
            <div class="mb-3">
                <div class="d-flex justify-content-between">
                    <strong>${usuario ? usuario.nome : 'N/A'}</strong>
                    <small class="text-muted">${new Date(item.data_acao).toLocaleString('pt-BR')}</small>
                </div>
                <p>${item.descricao}</p>
                <hr>
            </div>
        `;
    });
    
    $('#historico-container').html(html);
}

function carregarTecnicos(chamado) {
    const usuarios = DB.getUsuariosAtivos();
    const tecnicos = usuarios.filter(u => u.is_tecnico || u.is_admin);
    
    let options = '<option value="">Não atribuído</option>';
    tecnicos.forEach(tec => {
        const selected = chamado.tecnico_id === tec.id ? 'selected' : '';
        options += `<option value="${tec.id}" ${selected}>${tec.nome}</option>`;
    });
    
    $('#tecnico_id').html(options);
    $('#status').val(chamado.status);
    $('#prioridade').val(chamado.prioridade);
}

function atualizarChamado(chamadoId) {
    const chamado = DB.getChamadoById(chamadoId);
    const status = $('#status').val();
    const prioridade = $('#prioridade').val();
    const tecnico_id = $('#tecnico_id').val();
    const comentario = $('#comentario').val();
    
    const alteracoes = [];
    
    if (status && status !== chamado.status) {
        alteracoes.push(`Status alterado de ${chamado.status} para ${status}`);
        chamado.status = status;
        if (status === 'resolvido') {
            chamado.data_resolucao = new Date().toISOString();
        }
    }
    
    if (prioridade && prioridade !== chamado.prioridade) {
        alteracoes.push(`Prioridade alterada de ${chamado.prioridade} para ${prioridade}`);
        chamado.prioridade = prioridade;
    }
    
    const tecnicoIdNum = tecnico_id ? parseInt(tecnico_id) : null;
    if (tecnicoIdNum !== chamado.tecnico_id) {
        if (tecnicoIdNum) {
            const tecnico = DB.getUsuarioById(tecnicoIdNum);
            alteracoes.push(`Chamado atribuído a ${tecnico.nome}`);
        } else {
            alteracoes.push('Atribuição removida');
        }
        chamado.tecnico_id = tecnicoIdNum;
    }
    
    if (alteracoes.length > 0 || comentario) {
        let descricao = alteracoes.join(', ');
        if (comentario) {
            descricao = descricao ? `${descricao}. Comentário: ${comentario}` : `Comentário: ${comentario}`;
        }
        
        DB.updateChamado(chamadoId, chamado);
        
        DB.addHistorico({
            chamado_id: chamadoId,
            usuario_id: Auth.getCurrentUser().id,
            acao: 'atualizacao',
            descricao: descricao
        });
        
        alert('Chamado atualizado com sucesso!');
        location.reload();
    } else {
        alert('Nenhuma alteração realizada.');
    }
}