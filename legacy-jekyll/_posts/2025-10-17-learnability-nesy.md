---
layout: distill
title: A learnability analysis on neuro-symbolic learning
date: 2025-10-10 09:00:00-0400
description: The learnability of a nesy task is decided by its DCSP solutions.
tags: neurips
categories: neuro-symbolic learning
related_posts: false
featured: true
authors:
  - name: Hao-Yuan He
    affiliations:
      name: Nanjing University
  - name: Ming Li
    affiliations:
      name: Nanjing University

bibliography: neurips2025.bib

_styles: >
  .fake-img {
    background: #bbb;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 0px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 12px;
  }
  .fake-img p {
    font-family: monospace;
    color: white;
    text-align: left;
    margin: 12px 0;
    text-align: center;
    font-size: 16px;
  }

---

Recently, neuro-symbolic learning becomes a hot research topic, the researchers aim to unify data-driven machine learning and knowledge-driven logical reasoning within one hybrid framework, 
where both learning model and reasoning model are full-capacity.
Representitive works including <d-cite key="deepproblog_aij">DeepProbLog</d-cite> and <d-cite key="dai_abl_2019">abductive learning</d-cite>.


<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/nesy_framework.jpg" class="img-fluid rounded z-depth-1 zoomable=true" %}
    </div>
</div>
<div class="caption">
    A typical inference process of a hybrid neuro-symbolic system.
</div>

In this case, the system including a learning model $f: \mathcal{X} \mapsto \mathcal{Z}$, which mapping the raw data into concept space; and a reasoning model $\mathtt{KB}$ consist of rules which restrict on the concept space. Given the concept sequence $\boldsymbol{z} = (z_1, \dots, z_m)$, the knowledge base can imply a signal or target label $y$.

Usually, the training process of NeSy system is weakly-supervised manner, i.e., learning model $f$ with only $(\boldsymbol{x}, y)$ pairs and background knowledge $\mathtt{KB}$ to be satisfied.

The objective is to learn $f$ that generalise on concepts well: 

$$
R_{0/1} = \mathbb{E}_{(x, z)} \left[\mathbb{I}(f(x)\neq z) \right].
$$

However, in the absense of supervision $\boldsymbol{z}$, only the surrogate nesy risk is accessible: 

$$
R_{nesy}(f) = \mathbb{E}_{(\boldsymbol{x}, y)}\left[ \mathbb{I}(f(\boldsymbol{x}) \land \mathtt{KB} \not\models y)\right]. 
$$

The nesy risk can be further surrogated with weighted model counting (WMC) or with abduction.